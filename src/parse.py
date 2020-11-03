#!/usr/bin/env python

from urllib import request
import csv
import json
import logging
import os
import sys

logger = logging.getLogger()

handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

"""
A script that runs through the list of provided listings and uses the
Google Geocode API to get the latitude and longitude.

Note the Geocode API is a little expensive and also a bit slow - so it makes sense
to run this script once and then cache the results.
"""


def geocode_row(row_data, index, API_KEY):
    ''' Use the Google Geocode API to convert address data into lat/lng coordinates and places
    '''
    logger.info(f"Geocoding row {index}")

    address = (row_data.get('Address Line 1', "") + ", " + row_data.get('Address Line 2', "")).strip(' ,')
    if address:
        address = f"{address}, {row_data['Town']}, {row_data['County']} {row_data['Postcode']}, {row_data['Country']}, UK".strip(' ,')
        address = address.replace(" ", "+").replace('&', '%26')

        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={API_KEY}"
        response = request.urlopen(url)
        try:
            response_data = json.loads(response.read())
        except json.JSONDecodeError as err:
            response_data = {'status': err}

        if response_data.get("status") == "OK":
            if len(response_data["results"]) > 1:
                logger.warning(f"More than one result from geocoding row {index} with address: {address}.  Response data: {response_data}")
            result = response_data["results"][0]
            details = result["geometry"]["location"]
            details.update({'place_id': result.get("place_id", None)})

            logger.info(f"Got geocode details from row {index} [{address}]: {details}")
            row_data.update(details)
        else:
            logger.info(f"Error with geocoding row {index}. Status: {response_data.get('status')}")
    else:
        logger.info(f"No address found for row {index}. Skipping geocoding.")

    return row_data


def parse_csv(csv_filename, config_data, api_key):
    logger.info(f"Parsing csv data in: {csv_filename}")

    # Load the data and extact the headings (first row) and data rows (other rows)
    rows = []
    with open(csv_filename, 'r') as csv_file:
        csv_reader = csv.reader(csv_file)
        rows = [row for row in csv_reader]

    headings = rows[0]
    rows = rows[1:]

    HEADING_MAPPINGS = config_data.get('heading_map', {})
    headings = [HEADING_MAPPINGS.get(h, h) for h in headings]

    # Columns to include in the data
    valid_columns = [i for i in range(len(headings)) if headings[i].strip() and ("query" not in headings[i].lower())]

    # Geocode each row
    counter = 1
    data = []
    for row in rows:
        counter += 1
        row_data = {headings[i]: row[i].strip() for i in valid_columns if i < len(row)}
        row_data = geocode_row(row_data, counter, api_key)
        data.append(row_data)

    # Save to JSON
    outfile_name = csv_filename.replace(".csv", ".json")
    with open(outfile_name, 'w') as f:
        json.dump(data, f)
