# ATARI SNDH player

## Credits

- All the musicians
- The amazing work by [the SNDH staff](http://sndh.atari.org/)
- Juergen Wothke for the sc68 port on javascript : https://github.com/wothke/sc68-2.2.1
- And the port to CODEF : http://namwollem.blogspot.co.uk/
- Martin Ivanov for the no-css treeview


## Howto

### Without generating the `files.json`

The file `files.json` describes the contents of the `www/musics` directory. The actual file reflects the SNDH archive 4.4
In order to use it as it, download the archive file from [http://sndh.atari.org/](http://sndh.atari.org/), and extract it to `www/musics`.


### Generate the `files.json`

- Put your music in the `www/musics` directory.
- Exectue the script to generate the `files.json`.
```bash
$ ./sndh.py
files.json generated \o/
```

###
- Make your `www` directory accessible via a web server.
- Listen !


## TODO

- The multi-tracks musics are currently no supported.
- Some tracks make the js to hang...