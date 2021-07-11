const socket = io();

//Constants
const $form = document.querySelector('#form');
const $input = document.querySelector('#input');
const $location = document.querySelector('#location');
const $send_btn = document.querySelector('#send-btn');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const urlTemplate = document.querySelector('#location-url-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Option
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

//Main
socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: capitalizeFirstLetter(message.username),
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMsg', (url) => {
  const html = Mustache.render(urlTemplate, {
    username: capitalizeFirstLetter(url.username),
    url: url.url,
    createdAt: moment(url.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomdata', (data) => {
  const html = Mustache.render(sideBarTemplate, {
    room: data.room,
    users: data.users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

$form.addEventListener('submit', (e) => {
  e.preventDefault();
  let message = $input.value;
  if (!message) {
    message = '👍';
  }
  $send_btn.setAttribute('disabled', 'disabled');
  socket.emit('chatmessage', message, (msg) => {
    $send_btn.removeAttribute('disabled');
    console.log('Delievered', msg);
  });
  $input.value = '';
  $input.focus();
});

$location.addEventListener('click', () => {
  $location.setAttribute('disabled', 'disabled');
  if (!navigator.geolocation) {
    $location.removeAttribute('disabled');
    return alert('Geolocation isnot supported by your browser');
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'location',
      {
        latitude: position.coords.latitude,
        longtitude: position.coords.longitude,
      },
      (err) => {
        if (err) {
          $location.removeAttribute('disabled');
          return console.log(err);
        }
        console.log('Location shared');
        $location.removeAttribute('disabled');
      }
    );
  });
});

socket.emit('join', { username, room }, (err) => {
  if (err) {
    alert('That name is already taken. Please take new name');
    location.href = '/';
  }
});
