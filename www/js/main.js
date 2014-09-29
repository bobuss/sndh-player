/*
* SC68 Web player interface
*
* 2014 Bertrand Tornil
*
* Lots of parts from
* Juergen Wothke works on https://github.com/wothke/sc68-2.2.1
*
* And the port to CODEF : http://namwollem.blogspot.co.uk/
*
* Awesome work of the SNDH-staff : http://sndh.atari.org/
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.le
*/

(function($) {
  $( document ).ready(function() {

    $.getJSON('js/files.json', function(songs_hierarchy){

      var sampleRate;

      try {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        sampleRate = (new AudioContext().sampleRate) * 1.0;
      } catch(e) {
        alert('Web Audio API is not supported in this browser (get Chrome 18 or Firefox 26)');
      }

      var defaultSongTimeout = 15*60*1000;

      function doOnLoad() {
        audio.initialAudioSetup();
        audio.startMusicPlayback();
      }

      function doOnEnd() {
        audio.playNextSong();
        player.setPauseMode(false);
      }

      function doOnTrackChange() {
        player.setPauseMode(false);
      }

      function doOnLoop() {
        // triggered when switching from one track to the next (within the same song file)
      }

      function doOnError() {
        doOnEnd();
      }

      var player= new Sc68Player(
        sampleRate,
        defaultSongTimeout,
        doOnLoad,
        doOnEnd,
        doOnTrackChange,
        doOnLoop,
        doOnError
      );

      Audio = function(songs_hierarchy) {
        this.audioCtx;
        this.bufferSource;
        this.gainNode;
        this.analyzerNode;

        this.current_directory = 'musics';
        this.songs_hierarchy = songs_hierarchy;
        this.current_track = window.location.hash;

        this.createPlaylistDisplay();
        this.selectCurrentTrack();

        this.playSong();
      };

      Audio.prototype = {
        initialAudioSetup: function() {
          if (typeof this.bufferSource != 'undefined') {
            this.bufferSource.stop(0);
          } else {
            this.setupAudioNodes();
          }
        },
        setupAudioNodes: function() {
          if (typeof this.audioCtx == 'undefined') {
            try {
              window.AudioContext = window.AudioContext||window.webkitAudioContext;
              this.audioCtx = new AudioContext();
            } catch(e) {
              alert('Web Audio API is not supported in this browser (get Chrome 18 or Firefox 26)');
            }
            this.analyzerNode = this.audioCtx.createAnalyser();
            var scriptNode = player.createScriptProcessor(this.audioCtx);
            this.gainNode = this.audioCtx.createGain();

            scriptNode.connect(this.gainNode);
            this.gainNode.connect(this.analyzerNode);
            this.analyzerNode.connect(this.audioCtx.destination);
          }
        },
        playNextSong: function() {
          this.playSong(someSong);
        },
        playPreviousSong: function() {
          this.playSong(someSong);
        },
        playSong: function() {
          var self = this;
          var arr = this.current_track.split("#");
          if (arr.length == 2) {
            var someSong = arr[1];
          } else {
            return
          }

          var track= 0;

          var xhr = new XMLHttpRequest();
          xhr.open("GET", someSong, true);
          xhr.responseType = "arraybuffer";

          xhr.onload = function (oEvent) {
            player.loadData(xhr.response, track, defaultSongTimeout);
            self.updateTrackInfos();
          }.bind(this);
          xhr.send(null);
        },
        togglePause: function() {
          player.isPaused = !player.isPaused;
          if (!player.isPaused) {
            $(".action-pause span").attr("class", "glyphicon glyphicon-pause");
          } else {
            $(".action-pause span").attr("class", "glyphicon glyphicon-play");
          }
        },
        startMusicPlayback: function() {
          player.setPauseMode(false);

          if (typeof this.bufferSource === 'undefined') {
            this.bufferSource = this.audioCtx.createBufferSource();
            if (!this.bufferSource.start) {
              this.bufferSource.start = this.bufferSource.noteOn;
              this.bufferSource.stop = this.bufferSource.noteOff;
            }
            this.bufferSource.start(0);
          }
        },
        createPlaylistDisplay: function() {
          var self = this;
          var markup = this.browseDirectoryStructure('', this.current_directory, 0);

          $(".songs-list").html('<ul>' + markup + '</ul>');

          $(".song-selector").click(function(){
            var track = $(this).attr('data-track');
            self.current_track = '#' + track;
            window.location.hash = track;
            self.playSong();
            return false;
          });
        },
        browseDirectoryStructure: function(root, walking_directory, deepId) {
          var self = this;
          var itemId = "item-" + deepId
          var markup = '<li><input type="checkbox" id="' + itemId + '" /><label for="' + itemId + '">' + walking_directory + '</label>';

          markup += '<ul>';

          if (root !== '') {
            walking_directory = root + '/' + walking_directory;
          }

          this.songs_hierarchy[walking_directory]['directories'].forEach(function(directory, i) {
            markup += self.browseDirectoryStructure(walking_directory, directory, deepId + '-' + i);
          });

          if (this.songs_hierarchy[walking_directory]['files'].length > 0) {
            this.songs_hierarchy[walking_directory]['files'].forEach(function(file) {
              var link = walking_directory + '/' + file;
              markup += '<li class="song-selector" data-track="' + link + '"><a class="song" href="#' + link + '">' + file + '</a></li>';
            });
          }

          markup += '</ul>';
          markup += '</li>'
          return markup;
        },
        updatePlaylistDisplay: function() {
          var self = this;
          $(".song").each(function(i, song){
            if (i == self.current) {
              $(song).addClass("active");
            } else {
              $(song).removeClass("active")
            }
          });
        },
        updateTrackInfos: function() {
          var trackInfos = player.title + ' by <em class="bg-success">' + player.author + '</em>';
          $(".desc").html(trackInfos);
        },
        selectCurrentTrack: function() {
          // @TODO
        }
      };


      $(document).keydown(function(ev){

        switch(ev.which) {

          // space key : pause toggle
          case 32:
            audio.togglePause();
            ev.preventDefault();
          break;

          // up key : play previous song
          case 38:
            //audio.playPreviousSong();
            ev.preventDefault();
          break;

          // up key : play next song
          case 40:
            //audio.playNextSong();
            ev.preventDefault();
          break;
        }

      });

      $(".action-stop").click(function(){
        audio.togglePause();
      })

      $(".action-play").click(function(){
        audio.playSong();
      });

      $(window).on('hashchange', function() {
        audio.current_track = window.location.hash;
        audio.playSong();
        return false;
      });

      var audio = new Audio(songs_hierarchy);
      audio.togglePause();

    });
  });
})(jQuery);