const generateMsg = (username, text) => {
  return {
    username,
    text,
    createdAt: new Date().getTime(),
  };
};

const genreateLocation = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime(),
  };
};

module.exports = { generateMsg, genreateLocation };
