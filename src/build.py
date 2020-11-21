#!/usr/bin/env python

'''
Main script for parsing all of the folder and building the index.html pages
'''

from jinja2 import Template, Environment, FileSystemLoader, select_autoescape
import os
import glob
import json
import sys

from parse import parse_csv


def read_config(folder_name):
    config_path = f"{folder_name}config.json"
    config = None
    if not os.path.exists(config_path):
        return None
    with open(config_path, "r") as f:
        config = json.load(f)
    return config


if __name__ == "__main__":

    # Setup the template environment
    env = Environment(
        loader=FileSystemLoader('./templates'),
        autoescape=select_autoescape(['html', 'xml'])
    )

    # Get the folders to be built and compile their configs
    folder_names = glob.glob("./*/")
    configs = {fn.strip("/."): read_config(fn) for fn in folder_names if read_config(fn)}

    # Get the build context
    API_KEY = os.environ.get('GM_API_KEY')
    API_KEY_DEV = os.environ.get('GM_API_KEY_DEV')
    context = {
        'GM_API_KEY': API_KEY,
        "map_configs": configs
    }
    print("BUILDING WITH CONTEXT")
    print(json.dumps(context, indent=4))

    # Build the home index.html
    env.get_template('home.html').stream(context).dump("index.html")

    # Build the admin index.html
    env.get_template('admin.html').stream(context).dump("draw/index.html")

    # Build each of the map folders (in order of folder name alphabetically)
    for dir_name, config in configs.items():
        # Make the data.json file
        if len(sys.argv) <= 1:
            parse_csv(f"{dir_name}/data.csv", config, API_KEY_DEV)

        # Get the template context
        context.update({"config": config})

        # Render the template to an index.html
        env.get_template('map.html').stream(context).dump(f"{dir_name}/index.html")
