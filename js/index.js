// configs

var keyboard_left_note = 'G3';
var piano_left_note = 'C2';
var piano_right_note = 'C7';
var piano_left_keyboard_left_note = 'C2';
var piano_right_keyboard_left_note = 'C6';
var fadeout_time = 150; // ms
var audio_start_time = 0;
// jQuery.fx.interval = 4;

// constants

var note_letters = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
var natural_note_letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
var flat_note_letters = ['Db', 'Eb', 'E', 'Gb', 'Ab', 'Bb', 'B'];

var notes = ['A0', 'Bb0', 'B0'];
var natural_notes = ['A0', 'B0'];
var flat_notes = ['A0', 'Bb0', 'B'];
for (var octave = 1; octave <= 7; octave++) {
  for (var i = 0; i < note_letters.length; i++) {
    notes.push(note_letters[i] + octave.toString());
  }
  for (var i = 0; i < natural_note_letters.length; i++) {
    natural_notes.push(natural_note_letters[i] + octave.toString());
  }
  for (var i = 0; i < flat_note_letters.length; i++) {
    flat_notes.push(flat_note_letters[i] + octave.toString());
  }
}
notes.push('C8');
natural_notes.push('C8');

keyboard_white_key_groups = [
  ['`'],
  ['Q', 'A', 'Z'],
  ['W', 'S', 'X'],
  ['E', 'D', 'C'],
  ['R', 'F', 'V'],
  ['T', 'G', 'B'],
  ['Y', 'H', 'N'],
  ['U', 'J', 'M'],
  ['I', 'K', ','],
  ['O', 'L', '.'],
  ['P', ';', '/'],
  ['[', '\''],
  [']'],
  ['\\'],
];

keyboard_black_key_groups = [
  ['1'],
  ['2'],
  ['3'],
  ['4'],
  ['5'],
  ['6'],
  ['7'],
  ['8'],
  ['9'],
  ['0'],
  ['-'],
  ['='],
];

char_to_keycode = { // because ascii code != keycode
  '⇥': 9, // tab
  ',': 188,
  '.': 190,
  '/': 191,
  ';': 186,
  '\'': 222,
  '[': 219,
  ']': 221,
  '\\': 220,
  '-': 189,
  '=': 187,
  '`': 192,
};

// initialize keycode-note mapping

var keyboard_left_note_idx = natural_notes.indexOf(keyboard_left_note);
var keycode_to_note_dict = {};
var note_to_keychar_dict = {};
var is_show_key_mapping = true;

function keycode_to_note (keycode) {
  return keycode_to_note_dict[keycode];
}

function set_keycode_note_mapping() {
  keycode_to_note_dict = {};
  note_to_keychar_dict = {};

  // set white key mapping
  for (var group_idx = 0; group_idx < keyboard_white_key_groups.length; group_idx++) {
    for (var j = 0; j < keyboard_white_key_groups[group_idx].length; j++) {
      var char = keyboard_white_key_groups[group_idx][j];
      var keycode = char_to_keycode.hasOwnProperty(char) ? char_to_keycode[char] : char.charCodeAt(0);
      var note = natural_notes[keyboard_left_note_idx + group_idx - 1];

      keycode_to_note_dict[keycode] = note;
      if (!note_to_keychar_dict.hasOwnProperty(note)) {
        note_to_keychar_dict[note] = [char];
      } else {
        note_to_keychar_dict[note].push(char);
      }
    }
  }

  // set black key mapping
  for (var group_idx = 0; group_idx < keyboard_black_key_groups.length; group_idx++) {
    for (var j = 0; j < keyboard_black_key_groups[group_idx].length; j++) {
      var char = keyboard_black_key_groups[group_idx][j];
      var keycode = char_to_keycode.hasOwnProperty(char) ? char_to_keycode[char] : char.charCodeAt(0);
      var note = flat_notes[keyboard_left_note_idx + group_idx];

      keycode_to_note_dict[keycode] = note;
      if (!note_to_keychar_dict.hasOwnProperty(note)) {
        note_to_keychar_dict[note] = [char];
      } else {
        note_to_keychar_dict[note].unshift(char);
      }
    }
  }
};

// binding keypress and audio play/stop

var key_fadeout_timeouts = {};
var key_is_pressed = {};
var $piano_keys = {};
var is_mouse_down = false;

function press_key(note) {
  if (!$piano_keys.hasOwnProperty(note)) return;
  if (key_is_pressed[note]) return;
  key_is_pressed[note] = true;
  $piano_keys[note].addClass("piano-key-pressed");
  play_audio(note);
};

function release_key(note) {
  if (!$piano_keys.hasOwnProperty(note)) return;
  key_is_pressed[note] = false;
  $piano_keys[note].removeClass("piano-key-pressed");
  fadeout_audio(note);
};

function reset_audio(note) {
  var audio = document.getElementById('audio-' + note);
  audio.pause();
  audio.currentTime = audio_start_time;
  audio.volume = 1.0;
  return audio;
}

function play_audio(note) {
  // stop previous fadeout
  clearTimeout(key_fadeout_timeouts[note]);

  var audio = reset_audio(note);
  audio.play();
};

function fadeout_audio(note, prev_time=new Date()) {
  var curr_time = new Date()
  var time_diff = curr_time - prev_time; // ms

  var audio = document.getElementById('audio-' + note);
  var new_volume = audio.volume - 1 * time_diff / fadeout_time;
  if (new_volume <= 0) {
    reset_audio(note);
  } else {
    key_fadeout_timeouts[note] = setTimeout(function() {
      audio.volume = new_volume;
      fadeout_audio(note, curr_time);
    }, 0);
  }
};

// insert key mapping on piano keys

function insert_key_mapping() {
  // clean keys
  Object.values($piano_keys).forEach( function($key) {
    $key.empty();
  });

  for (var note in note_to_keychar_dict) {
    if (!note_to_keychar_dict.hasOwnProperty(note)) continue;
    var chars = note_to_keychar_dict[note];
    $key = $piano_keys[note];
    if ($key) {
      $text_container = $('<div class="piano-key-text-container"></div>');
      chars.forEach(function(char) {
        $text_container.append('<div class="piano-key-text">' + char + '</div>');
      });
      $key.append($text_container);
    }
  }
}

// shift key mapping

function left_shift_key_mapping() {
  if (keyboard_left_note_idx === natural_notes.indexOf(piano_left_keyboard_left_note))
    return;

  keyboard_left_note_idx -= 1;
  set_keycode_note_mapping();
  insert_key_mapping();
  show_hide_key_mapping();
}

function right_shift_key_mapping() {
  if (keyboard_left_note_idx === natural_notes.indexOf(piano_right_keyboard_left_note))
    return;

  keyboard_left_note_idx += 1;
  set_keycode_note_mapping();
  insert_key_mapping();
  show_hide_key_mapping();
}

function show_hide_key_mapping() {
  if ($('#is-show-key-mapping')[0].checked) {
    $('.piano-key-text').css("display", "block");
  } else {
    $('.piano-key-text').css("display", "none");
  }
};

// main

var onload = function() {
  set_keycode_note_mapping();

  // insert html audio elements

  var $head = $('head');
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    $head.append('<audio id="audio-' + note + '" src="audio/Piano.ff.' + note + '.mp3" preload="auto"></audio>');
  }

  // mouse state

  $(document).mousedown(function(event) {
    is_mouse_down = true;
  });
  $(document).mouseup(function(event) {
    is_mouse_down = false;
  });

  // insert piano keys

  var $keyboard = $('#piano-keyboard');
  var piano_left_note_idx = notes.indexOf(piano_left_note);
  var piano_right_note_idx = notes.indexOf(piano_right_note);

  for (var i = piano_left_note_idx; i <= piano_right_note_idx; i++) {
    var note = notes[i];
    var is_black_key = (note[1] === 'b');
    var $element, $key;
    if (is_black_key) {
      $key = $('<div class="piano-key-black" id="piano-key-' + note + '"></div>')
      $element = $('<div class="piano-key-black-wrapper"></div>');
      $element.append($key);
    } else {
      $key = $('<div class="piano-key-white" id="piano-key-' + note + '"></div>');
      $element = $key;
    }

    $key.data('note', note);

    // mouse events
    $key.bind("touchstart", function(e){
      press_key($(this).data('note'));
      e.stopPropagation();
    });
    // $key.bind("touchend", function(e) {
    //   release_key($(this).data('note'));
    //   e.stopPropagation();
    // });
    $key.mousedown(function() { press_key($(this).data('note')); });
    $key.mouseup(function() { release_key($(this).data('note')); });
    $key.mouseenter(function() { if (is_mouse_down) press_key($(this).data('note')); });
    $key.mouseleave(function() { release_key($(this).data('note')); });


    $keyboard.append($element);
    $piano_keys[note] = $key;
  }

  // insert key mapping into keys

  insert_key_mapping();

  // scroll piano keyboard to center
  var $piano_container = $('#piano-container');
  $piano_container.scrollLeft(($keyboard.width()-$piano_container.width())/2)

  // keyboard events

  $(document).keydown(function(event) {
    // disable TAB key
    if(event.which == 9) { event.preventDefault(); }
    // left arrow
    else if (event.which === 37) {
      left_shift_key_mapping();
    }
    // right arrow
    else if (event.which === 39) {
      right_shift_key_mapping();
    }
    else {
      var keycode = event.which;
      var note = keycode_to_note(keycode);
      press_key(note);
    }
  });
  $(document).keyup(function(event) {
    // disable TAB key
    // if(event.which == 9) { event.preventDefault(); }

    var keycode = event.which;
    var note = keycode_to_note(keycode);
    release_key(note);
  });

  $('#left-arrow-button').click(function() {
    left_shift_key_mapping();
  });
  $('#right-arrow-button').click(function() {
    right_shift_key_mapping();
  });

  // decide whether to show key mapping

  $('#is-show-key-mapping').change(show_hide_key_mapping);
  show_hide_key_mapping();
}

window.onload = onload;
