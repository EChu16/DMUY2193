const INITIAL_VID_ID = 'M7lc1UVf-VE'
const YT_PADDING = 15;
var vidNotes;

function onYouTubeIframeAPIReady() {
	// Calculate youtube video dimensions
	const ytWidth = (window.outerWidth * .60) - (YT_PADDING * 2);
	const ytHeight = (ytWidth * 9) / 16;
  var yt = new YT.Player('player', {
    height: ytHeight,
    width: ytWidth,
    videoId: INITIAL_VID_ID,
    events: {
      'onReady': onPlayerReady,
    }
  });
  vidNotes = new VidNotes(yt, INITIAL_VID_ID);
  vidNotes.initialize();
}

function onPlayerReady(event) {
	var yt_player = event.target;
  yt_player.playVideo();
  yt_player.seekTo(0);
}

function VidNotes(yt, videoId) {
  this.yt = yt;
  this.videoId = videoId;
  this.notes = {};
  this.currentNoteIdx = -1;

  this.initialize = function() {
  	this.setElementSizes();
  	this.bindElements();
  	this.initOrGetNotes(this.videoId);
  }

  this.setElementSizes = function() {
  	const ytWidth = (window.outerWidth * .60) - (YT_PADDING * 2);
		const ytHeight = (ytWidth * 9) / 16;
		this.yt.setSize(ytWidth, ytHeight);
		const genericWidth = window.outerWidth * .38;

		$('#vn-notes').css({'width': genericWidth});
		$('#vn-tools').css({'width': genericWidth});
		$('#vn-notes-container').css({'height': window.outerHeight * .60});
		$('#vn-text').css({'width': genericWidth - 5, 'height': (window.outerHeight * .15)});
		this.setNoteSizes();
  }

  this.setNoteSizes = function() {
  	const notesWidth= $('#vn-notes-container').width();
  	const genericWidth = window.outerWidth * .38;
  	$('.vn-timestamp').each(function() {
			$(this).css({'width':(notesWidth * .15)});
		});
		$('.vn-note-text').each(function() {
			$(this).css({'width':(notesWidth * .80)});
		});
		$('.note-entry').each(function() {
			$(this).css({'width': genericWidth});
		});
  }

  this.bindElements = function() {
  	var self = this;
  	$(window).resize(function() {
			self.setElementSizes();
		});
  	$('#vn-submit').click(function() {
  		var vnText = $('#vn-url-text');
  		self.playYTUrl(vnText.val());
  		vnText.val('');
  	});
    $('#vn-export').click(function() {
      prompt("Copy data below to import elsewhere", localStorage['VidNotes']);
    })
    $('#vn-import').click(function() {
      const vn_data = prompt("Input VidNotes data... this will overwrite pre-existing notes for all videos", "");
      if (vn_data != null && vn_data != "") {
        localStorage['VidNotes'] = vn_data;
        self.reloadNotesContainer();
      }
    })
  	$('#vn-submit-note').click(function() {
  		const currentTime = self.yt.getCurrentTime()
  		const noteEntry = $('#vn-text');
  		if (noteEntry.val() == "") {
  			return;
  		}
      const submitHTML = $('#vn-submit-note').html();
      if(submitHTML == "Submit") {
        self.saveNote(currentTime, noteEntry.val());
      } else if(submitHTML == "Save edit") {
        self.saveNoteEdit(noteEntry.val());
      }
  		self.reloadNotesContainer();
  		noteEntry.val('');
  	});
  	$('#vn-notes-container').on('click', '.vn-timestamp-text', function() {
  		const timeVal = $(this).html().split(':').reduce((acc,time) => (60 * acc) + +time);
  		self.playVideoAt(timeVal);
  	});

    $('#vn-notes-container').on('click', '.edit-icon', function() {
      self.editNoteMode($(this).closest('.note-entry'));
    });

    $('#vn-notes-container').on('click', '.trash-icon', function() {
      self.deleteNote($(this).closest('.note-entry'));
    });
  }

  this.playVideoAt = function(timeVal) {
  	this.yt.seekTo(timeVal);
  }

  this.getVidTimeStamp = function(timeStamp) {
  	return new Date(timeStamp * 1000).toISOString().substr(11, 8);
  }

  this.playYTUrl = function(newYTUrl) {
  	const ytId = this.extractYTIdFromURL(newYTUrl);
  	this.videoId = ytId;
  	this.yt.cueVideoById(ytId);
  	this.initOrGetNotes(ytId);
  	this.playVideo();
  }

  this.extractYTIdFromURL = function(ytURL) {
  	// Extract youtube ID from URL since cueVideoByURL requires specific formatting
  	var ytIdSection = ytURL.split('v=')[1];
  	// If id exists, extract only the id as it should always be the first param
  	if (ytIdSection) {
  		return ytIdSection.split('&')[0];
  	}
  	return '';
  }

  this.initOrGetNotes = function(videoId) {
  	if (localStorage.getItem('VidNotes') === null) {
  		localStorage.setItem('VidNotes', JSON.stringify({}));
  	}
		var vidNotesStorage = JSON.parse(localStorage.getItem('VidNotes'));
		if (!(videoId in vidNotesStorage)) {
  		vidNotesStorage[videoId] = [];
  		localStorage.setItem('VidNotes', JSON.stringify(vidNotesStorage));
  	}
  	this.reloadNotesContainer();
  }

  this.saveNote = function(timeStampSeconds, noteEntry) {
  	const newNote = {'timeStamp': timeStampSeconds, 'note': noteEntry};
  	var vidNotesStorage = JSON.parse(localStorage.getItem('VidNotes'));
  	vidNotesStorage[this.videoId].push(newNote);
    vidNotesStorage[this.videoId].sort(function(a, b) {
      return parseFloat(a['timeStamp']) - parseFloat(b['timeStamp'])
    });
  	localStorage.setItem('VidNotes', JSON.stringify(vidNotesStorage));
  }

  this.appendNote = function(timeStamp, noteEntry) {
  	const noteTimeStamp = this.getVidTimeStamp(timeStamp);
		const noteHTML = "<div class='note-entry'><div class='vn-timestamp'><span class='vn-timestamp-text'>" + 
			noteTimeStamp + 
			"</span><div class='note-tools-wrapper'><img class='note-tools edit-icon' src='images/edit_icon.png'>" + 
      "<img class='note-tools trash-icon' src='images/trash_icon.png'></div></div><div class='vn-note-text'>" + 
			noteEntry + "</div></div>";
		$('#vn-notes-container').append(noteHTML);
		this.setNoteSizes();
	}

  this.reloadNotesContainer = function() {
    $('#vn-notes-container').html('');
    var vidNotesStorage = JSON.parse(localStorage.getItem('VidNotes'));
    const videoNotes = vidNotesStorage[this.videoId];
    for (i = 0; i < videoNotes.length; i++) {
      const noteObj = videoNotes[i];
      this.appendNote(noteObj.timeStamp, noteObj.note);
    }
  }

  this.editNoteMode = function(noteElement) {
    const noteIdx = $('.note-entry').index(noteElement);
    this.currentNoteIdx = noteIdx;
    const editNoteHTML = $(noteElement).find('.vn-note-text').html();
    $('#vn-text').val(editNoteHTML);
    $('#vn-submit-note').html("Save edit");
  }

  this.saveNoteEdit = function(noteElement) {
    if(this.currentNoteIdx != -1) {
      var vidNotesStorage = JSON.parse(localStorage.getItem('VidNotes'));
      vidNotesStorage[this.videoId][this.currentNoteIdx]['note'] = $('#vn-text').val();
      localStorage.setItem('VidNotes', JSON.stringify(vidNotesStorage));
      this.resetToNormalState();
      this.reloadNotesContainer();
    }
  }

  this.resetToNormalState = function() {
    this.currentNoteIdx = -1;
    $('#vn-text').html("");
    $('#vn-submit-note').html("Submit");
  }

  this.deleteNote = function(noteElement) {
    const noteIdx = $('.note-entry').index(noteElement);
    if(noteIdx != -1) {
      if(this.currentNoteIdx != -1) {
        this.resetToNormalState();
      }
      var vidNotesStorage = JSON.parse(localStorage.getItem('VidNotes'));
      vidNotesStorage[this.videoId].splice(noteIdx, 1);
      localStorage.setItem('VidNotes', JSON.stringify(vidNotesStorage));
      this.reloadNotesContainer();
    }
  }

  this.playVideo = function() {
  	this.yt.seekTo(0);
  	this.yt.playVideo();
  }
}
