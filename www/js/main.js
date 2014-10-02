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
        gfx.reqAnimationFrame();
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
        this.currentSong = window.location.hash;
        this.currentTrack = 1;

        this.createPlaylistDisplay();

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
        playNextTrack: function() {
          if (this.currentTrack < player.numberOfTracks) {
            this.currentTrack++;
          }
          player.playSong(this.currentTrack);
          this.updateTrackInfos();
        },
        playPreviousTrack: function() {
          if (this.currentTrack > 1 ) {
            this.currentTrack--;
          }
          player.playSong(this.currentTrack);
          this.updateTrackInfos();
        },
        playSong: function() {
          var self = this;
          var arr = this.currentSong.split("#");
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
        },
        stopSong: function() {
          player.playSong(this.currentTrack);
          player.setPauseMode(true);
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
            self.currentSong = '#' + track;
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
          $(".tracks").html(this.currentTrack + ' / ' + player.numberOfTracks);
        },
      };

      Graphix = function(audio) {

        this.audio = audio;

        this.WIDTH = 400;
        this.HEIGHT = 256;


        var canvasSpectrum = document.getElementById("spectrum"); //$('.spectrum');
        this.ctxSpectrum = canvasSpectrum.getContext('2d');
        canvasSpectrum.width = this.WIDTH;

        //initialize analyser
        this.audio.analyzerNode.fftSize = 1024 ;
        this.audio.analyzerNode.smoothingTimeConstant = 0.7;
        this.bufferLength = this.audio.analyzerNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        this.ctxSpectrum.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        this.gradients = {};
      };

      Graphix.prototype = {
        reqAnimationFrame: function() {
          window.requestAnimationFrame(this.redrawSpectrum.bind(this));
        },
        gradient: function(i) {
          if (!(i in this.gradients)) {
            var gradient = this.ctxSpectrum.createLinearGradient(0, 0, 0, this.HEIGHT);
            gradient.addColorStop(1, 'rgb(0, 0, 0)');
            gradient.addColorStop(0.75, 'rgb(255, 0, ' + i + ')');
            gradient.addColorStop(0.25, 'rgb(255, 255, ' + i + ')');
            gradient.addColorStop(0, 'rgb(255, 255, 255)');
            this.gradients[i] = gradient;
          }
          return this.gradients[i];

        },
        redrawSpectrum: function() {
          this.reqAnimationFrame();

          this.audio.analyzerNode.getByteFrequencyData(this.dataArray);
          this.ctxSpectrum.fillStyle = 'rgb(255, 255, 255)';
          this.ctxSpectrum.fillRect(0, 0, this.WIDTH, this.HEIGHT);

          var step = 2;
          var barWidth = (this.WIDTH / this.bufferLength) * step;
          var barHeight;
          var x = 0;

          for(var i = 5; i < this.bufferLength; i += step) {
            barHeight = this.dataArray[i];

            this.ctxSpectrum.fillStyle = this.gradient(i);
            this.ctxSpectrum.fillRect(x, this.HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
          }

        },
        text: function(ctx, text, x, y) {
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        },
      };


      $(document).keydown(function(ev){

        switch(ev.which) {

          // space key : pause toggle
          case 32:
            audio.togglePause();
            ev.preventDefault();
          break;

          // left key : play previous track
          case 37:
            audio.playPreviousTrack();
            ev.preventDefault();
          break;

          // right key : play next track
          case 39:
            audio.playNextTrack();
            ev.preventDefault();
          break;
        }

      });

      $(".action-stop").click(function(){
        audio.stopSong();
      })

       $(".action-pause").click(function(){
        audio.togglePause();
      })

      $(".action-play").click(function(){
        audio.playSong();
      });

      $(".action-next").click(function(){
        audio.playNextTrack();
      });

      $(".action-prev").click(function(){
        audio.playPreviousTrack();
      });


      $(window).on('hashchange', function() {
        audio.currentSong = window.location.hash;
        audio.playSong();
        return false;
      });

      var audio = new Audio(songs_hierarchy);
      audio.initialAudioSetup()
      var gfx = new Graphix(audio);
      audio.togglePause();

    });
  });
})(jQuery);