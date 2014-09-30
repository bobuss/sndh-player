#!/usr/bin/env python

import fnmatch
import os
import json
from collections import defaultdict


def generate_json_directory_structure():
    try:
        script_path = os.path.dirname(os.path.realpath(__file__))

        www_path = os.path.normpath(os.path.join(script_path, 'www'))
        music_path = os.path.join(www_path, 'musics')
        js_path = os.path.join(www_path, 'js')

        musics = defaultdict(dict)

        for root, dirnames, filenames in os.walk(music_path):
            rel_path = os.path.relpath(root, www_path)

            musics[rel_path] = {
                'directories': dirnames,
                'files': []
            }
            for filename in fnmatch.filter(filenames, '*.sndh'):
                musics[rel_path]['files'].append(filename)

        with open(os.path.join(js_path, 'files.json'), 'w') as f:
            f.write(json.dumps(musics, sort_keys=True, indent=4, separators=(',', ': ')))

        print "files.json generated \o/\n"

    except Exception as e:

        print "Error while generating files.json /o\\\n"
        print e.message


if __name__ == '__main__':
    generate_json_directory_structure()
