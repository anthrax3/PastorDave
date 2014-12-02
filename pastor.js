/**
 * Pastor Bot 2.0
 *
 * @Dependencies: irc, underscore
 *
 * @Author: Jim Rastlerton
 * 
 * Uses the talkativeness from dikkv
 */
var irc = require('irc'),
    fs = require('fs'),
    _ = require('underscore');

var server = 'irc.rizon.us',
    port = 6667,
    chans = ['#JesusLovesAll'],
    commandIdentifer = "!",
    nick = 'PastorDave',
    user = 'goodnews',
    realName = 'Pastor Dave',
    masters = ['jimmy_r'],
    phrases = fs.readFileSync('phrases.txt').toString().split("\n"),
    langResps = fs.readFileSync('langCheck.txt').toString().split("\n");

var client = new irc.Client(server, nick, {
  userName: user,
  realName: realName,
  channels: chans,
  port: port,
  debug: true, // display verbose output
  secure: false, // use secure connection
  selfSigned: true, // accept non trusted ca
  certExpired: true, // accept expired certs
  floodProtection: false,
  floodProtectionDelay: 1500,
});

// word librarys
var wordLib = {
  badWords: [
    "shit",
    "piss",
    "fuck",
    "cunt",
    "cocksucker",
    "mother fucker",
    "twat",
    "nigger",
    "fucking"
  ],
  triggers: [ // Not implemented
    "jesus",
    "christ"
  ]
};

var users = {}, // users for each channel
    levels = {}, // Levels for the channels, used for determining when to talk
    talky = {}, // talky is an integer measure of how talkative a given channel is
    lastSpeaker = "",
    minLevel = -1,
    talkyMax = 9,
    talkyMin = 2,
    threshold = 7; // What must the level be on the channel before speaking

var preach01 = 'Have you all heard the good news of the Lord and Savior Jesus Christ?',
    preach02 = 'Did you know that Jesus Christ died on the Cross for all your sins?',
    preach03 = 'Well, he did.',
    preach04 = 'Has anyone here read the Bible?',
    preach05 = 'Let us Pray.',
    preach06 = 'Our Father, who art in heaven,',
    preach07 = 'hallowed be thy Name.',
    preach08 = 'Thy Kingdom come.',
    preach09 = 'Thy will be done,',
    preach10 = 'On Earth as it is in heaven.',
    preach11 = 'Give us this day our daily bread.',
    preach12 = 'And forgive us our trespasses,',
    preach13 = 'As we forgive those who trespass against us.',
    preach14 = 'And lead us not into temptation, but deliver us from evil.',
    preach15 = 'For thine is the kingdom, and the power, and the glory,',
    preach16 = 'for ever and ever.',
    preach17 = 'Amen.',
    preach18 = 'Thank you all very much. God bless each and every single one of you.',
    preach19 = 'Goodbye';

chans.forEach(function(chan) {
  users[chan] = {
    init: false,
    nicks: []
  };
  levels[chan] = Math.floor(Math.random()*11)+1;
  talky[chan] = -1;
});

// String contains polyfill
if (!String.prototype.contains ) {
  String.prototype.contains = function() {
    return String.prototype.indexOf.apply(this, arguments) !== -1;
  };
}

function parseCommand(message) {
  if (message[0] === commandIdentifer) {
    var params = message.split(" "),
        command = params[0].slice(1),
        comObj = { command: command };
    params.shift();
    comObj.params = params;
    return comObj;
  }
  else {
    return false;
  }
}

// Join and preach to a channel, then leave
function preach(chan) {
  function intro(chan) {
    client.join(chan);
    setTimeout(function() {
      client.say(chan, preach01);
      setTimeout(function() {
        client.say(chan, preach02);
        setTimeout(function() {
          client.say(chan, preach03);
          setTimeout(function() {
            client.say(chan, preach04);
            closingPrayer1(chan);
          }, 20000);
        }, 8000);
      }, 15000);
    }, 1000);
  }
  
  function closingPrayer1(chan) {
    setTimeout(function() {
      client.say(chan, preach05);
      setTimeout(function() {
        client.say(chan, preach06);
        setTimeout(function() {
          client.say(chan, preach07);
          setTimeout(function() {
            client.say(chan, preach08);
            setTimeout(function() {
              client.say(chan, preach09);
              setTimeout(function() {
                client.say(chan, preach10);
                closingPrayer2(chan);
              }, 3000);
            }, 2500);
          }, 3000);
        }, 4500);
      }, 8000);
    }, 10000);
  }
  
  function closingPrayer2(chan) {
    setTimeout(function() {
      client.say(chan, preach11);
      setTimeout(function() {
        client.say(chan, preach12);
        setTimeout(function() {
          client.say(chan, preach13);
          setTimeout(function() {
            client.say(chan, preach14);
            setTimeout(function() {
              client.say(chan, preach15);
              setTimeout(function() {
                client.say(chan, preach16);
                setTimeout(function() {
                  client.say(chan, preach17);
                  exit(chan);
                }, 1500);
              }, 1000);
            }, 3000);
          }, 3500);
        }, 4000);
      }, 3500);
    }, 3000);
  }
  
  function exit(chan) {
    setTimeout(function() {
      client.say(chan, preach18);
      setTimeout(function() {
        client.say(chan, preach19);
        client.part(chan);
      }, 2000);
    }, 5000);
  }
  
  intro(chan);
}

// Say something random to a channel
function saySomething(chan) {
  var sayList = _.shuffle(phrases),
      nickList = _.shuffle(users[chan].nicks),
      toSay = _.sample(sayList),
      toNick = _.sample(nickList);
      
  // Replace %s with a random nick in the channel
  if (toSay !== "") {
    toSay = toSay.replace(/%s/gi, toNick);
  }
  
  // If line is /me (action), send it to channel
  if (toSay.match(/^\/me/gi)) {
    toSay = toSay.slice(4); // remove /me and the space
    client.action(chan, toSay);
  }
  else {
    client.say(chan, toSay);
  }
}

// Language say
function checkYourMouth(chan, who) {
  var sayList = _.shuffle(langResps),
      toSay = _.sample(sayList);
      
  toSay = toSay.replace(/%s/gi, who);
  client.say(chan, toSay);
}


/**
 *  client event bindings
 */
client.addListener('error', function(msg) {
  console.error('Error: %s: %s', msg.command, msg.args.join(' '));
});

client.addListener('message', function(from, to, message) {
  console.log("--- MSG ---\n");
  
  // Only if the message was to a channel
  if (to.match(/^#/)) {
    if (talky[to] < talkyMax) {
      console.log("talky[%s]:  %s", to, talky[to]);
      talky[to]++;
    }
    
    // if there is a bad word said
    for (var a = 0; a < wordLib.badWords.length; a++) {
      if (message.contains(wordLib.badWords[a])) {
        checkYourMouth(to, from);
        
        if (levels[to] < minLevel) {
          levels[to] = minLevel;
        }
        else {
          levels[to] -= 5;
        }
      }
    }
    
    // don't count the same person talking to self as activity
    if (from == lastSpeaker) {
      if (talky[to] > talkyMin) {
        talky[to]--;
      }
      levels[to]--;
    }
    lastSpeaker = from;
    
    // if someone addressed us, increase chance of saying something
    if (message.contains(nick)) {
      levels[to] += 6;
      if (talky[to] < (talkyMax -1)) {
        talky[to]++;
      }
    }
    
    // Pastor gets more/less talkative with the channel
    levels[to] += talky[to];
    console.log("talky[%s]:  %d", to, talky[to]);
    console.log("levels[%s]:  %d", to, levels[to]);
    
    while (levels[to] > threshold) {
      saySomething(to);
      levels[to] -= 10;
    }
  }
});

client.addListener('names', function(chan, nicks) {
  if (!users[chan].init) {
    for (var a in nicks) {
      if (a !== nick) { 
        users[chan].nicks.push(a);
      }
    }
    users[chan].init = true;
  }
});

client.addListener('pm', function(nick, message) {
  var com = parseCommand(message);
  
  if (com) {
    
    // Anyone can spread the Word of the Lord
    if (com.command == 'preach') {
      if (com.params[0]) {
        preach(com.params[0]);
      }
      else {
        client.say(nick, '!preach #channel');
      }
    }
    
    // If the pm was from one of our masters
    if (masters.indexOf(nick) !== -1) {
      
      var channel;
      
      /**
       * Join Channel
       */
      if (com.command == 'join') {
        channel = com.params[0];
        client.join(channel);
      }
      
      /**
       * Part Channel
       */
      if (com.command == 'part') {
        channel = com.params[0];
        com.params.shift();
        var msg = com.params.join(" ");
        client.part(channel, msg);
      }
      
      /**
       * Say Channel/To
       */
      if (com.command == 'say') {
        var to = com.params[0];
        com.params.shift();
        client.say(to, com.params.join(' '));
      }
    }
  }
});

client.addListener('join', function(channel, who) {
  console.log('%s has joined %s', who, channel);
  
  if (who == nick && chans.indexOf(channel) === -1) {
    chans.push(channel);
    users[channel] = {
      init: false,
      nicks: []
    };
    levels[channel] = Math.floor(Math.random()*11)+1;
    talky[channel] = -1;
  }
});

client.addListener('part', function(channel, who, reason) {
  console.log('%s has left %s: %s', who, channel, reason);
});

client.addListener('kick', function(channel, who, by, reason) {
  console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
});

// Decrease channels talkiness levels
setInterval(function() {
  chans.forEach(function(chan) {
    talky[chan]--;
    if (talky[chan] < talkyMin) {
      talky[chan] = talkyMin;
    }
  });
}, 9000);
