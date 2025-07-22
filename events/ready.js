module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Source-chan conectada como ${client.user.tag}`);
  },
};
