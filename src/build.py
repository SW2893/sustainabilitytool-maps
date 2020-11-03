'''
Main script for parsing all of the folder and building the index.html pages
'''

from jinja2 import Template, Environment, FileSystemLoader, select_autoescape
import os
import glob
import json


def read_config(folder_name):
    config_path = f"{folder_name}config.json"
    config = None
    if not os.path.exists(config_path):
        return None
    with open(config_path, "r") as f:
        config = json.load(f)
    return config


# Setup the template environment
env = Environment(
    loader=FileSystemLoader('./templates'),
    autoescape=select_autoescape(['html', 'xml'])
)

# Get the build context
context = {
    'GM_API_KEY': os.environ.get('GM_API_KEY')
}

# Get the folders to be built and compile their configs
folder_names = glob.glob("./*/")
configs = {fn.strip("/."): read_config(fn) for fn in folder_names if read_config(fn)}
context.update({
    "map_configs": configs
})
print("USING CONTEXT", json.dumps(context, indent=4))

# Build the home index.html
template = env.get_template('home.html')
result = template.render(context)
print(result)
