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
A script that runs through the list of provided MEP listings and uses the
Google Geocode API to get the latitude and longitude.

Note the Geocode API is a little expensive and also a bit slow - so it makes sense
to run this script once and then cache the results.

Ensure that the environment has your Google Maps API key in the environment
variable "GM_API_KEY"
"""

DIR_NAME = os.path.dirname(__file__)
os.chdir(DIR_NAME)
logger.info(f"Parsing csv data in {DIR_NAME}")

API_KEY = os.environ.get('GM_API_KEY')
if API_KEY is None:
    raise Exception("No API Key found - set environment variable GM_API_KEY and run again")

# Load the data and extact the headings (first row) and data rows (other rows)
rows = []
with open('data.csv', 'r') as csv_file:
    csv_reader = csv.reader(csv_file)
    rows = [row for row in csv_reader]

headings = rows[0]
rows = rows[1:]

# Load mappings from the config.json
with open('config.json', 'r') as config_file:
    config_data = json.load(config_file)

HEADING_MAPPINGS = config_data.get('heading_map', {})
headings = [HEADING_MAPPINGS.get(h, h) for h in headings]

# Columns to include in the data
valid_columns = [i for i in range(len(headings)) if headings[i].strip() and ("query" not in headings[i].lower())]


def geocode_row(row_data, index):
    ''' Use the Google Geocode API to convert address data into lat/lng coordinates and places
    '''
    logger.info(f"Geocoding row {index}")

    address = (row_data.get('Address Line 1', "") + ", " + row_data.get('Address Line 2', "")).strip(' ,')
    if address:
        address = f"{address}, {row_data['Town']}, {row_data['County']} {row_data['Postcode']}, {row_data['Country']}".strip(' ,')
        address = address.replace(" ", "+")

        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={API_KEY}"
        response = request.urlopen(url)
        try:
            response_data = json.loads(response.read())
        except json.JSONDecodeError as err:
            response_data = {'status': err}

        if response_data.get("status") == "OK":
            if len(response_data["results"]) > 1:
                logger.warning(f"More than one result from geocoding row {index} in response data: {response_data}")
            result = response_data["results"][0]
            details = result["geometry"]["location"]
            details.update({'place_id': result.get("place_id", None)})

            logger.info(f"Got geocode details from row {index}: {details}")
            row_data.update(details)
        else:
            logger.info(f"Error with geocoding row {index}. Status: {response_data.get('status')}")
    else:
        logger.info(f"No address found for row {index}. Skipping geocoding.")

    return row_data

# Geocode each row
counter = 1
data = []
for row in rows:
    counter += 1
    row_data = {headings[i]: row[i].strip() for i in valid_columns}
    row_data = geocode_row(row_data, counter)
    data.append(row_data)

# Save to JSON
with open('data.json', 'w') as f:
    json.dump(data, f)
