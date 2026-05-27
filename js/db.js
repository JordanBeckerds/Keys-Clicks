/* éphémère — Firebase Realtime Database Layer */
const DB = (() => {
  let _db = null;

  function init(config) {
    if (!firebase.apps.length) firebase.initializeApp(config);
    _db = firebase.database();
    return _db;
  }

  function db() { return _db; }

  function convId(a, b) { return [a, b].sort().join('__'); }

  return {
    init,
    convId,

    /* ── Online presence ── */
    async isUsernameFree(username) {
      const snap = await db().ref(`/online/${username}`).get();
      if (!snap.exists()) return true;
      // Same sessionId = page refresh by same tab → allow reclaim
      const stored = sessionStorage.getItem('ephem_sid');
      return stored && snap.val().sessionId === stored;
    },

    async claimUsername(username, userData) {
      const ref = db().ref(`/online/${username}`);
      const snap = await ref.get();
      const stored = sessionStorage.getItem('ephem_sid');
      if (snap.exists() && snap.val().sessionId !== stored) return false;
      await ref.set(userData);
      ref.onDisconnect().remove();
      return true;
    },

    releaseUsername(username) {
      db().ref(`/online/${username}`).remove();
      db().ref(`/online/${username}`).onDisconnect().cancel();
    },

    watchOnline(callback) {
      db().ref('/online').on('value', snap => {
        const map = {};
        snap.forEach(c => { map[c.key] = { username: c.key, ...c.val() }; });
        callback(map);
      });
    },

    offOnline() { db().ref('/online').off(); },

    /* ── Messages ── */
    sendMessage(cid, msg) {
      return db().ref(`/messages/${cid}`).push(msg);
    },

    watchMessages(cid, onAdded, onChanged) {
      db().ref(`/messages/${cid}`)
        .orderByChild('sentAt')
        .on('child_added',   s => onAdded({ id: s.key, ...s.val() }));
      db().ref(`/messages/${cid}`)
        .on('child_changed', s => onChanged && onChanged({ id: s.key, ...s.val() }));
    },

    offMessages(cid) { db().ref(`/messages/${cid}`).off(); },

    updateMessage(cid, msgId, patch) {
      return db().ref(`/messages/${cid}/${msgId}`).update(patch);
    },

    deleteMessage(cid, msgId) {
      return db().ref(`/messages/${cid}/${msgId}`).remove();
    },

    /* ── Stories ── */
    addStory(story) { return db().ref('/stories').push(story); },

    watchStories(callback) {
      const cutoff = Date.now() - 24 * 3600000;
      db().ref('/stories').orderByChild('createdAt').startAt(cutoff)
        .on('value', snap => {
          const list = [];
          snap.forEach(c => list.push({ id: c.key, ...c.val() }));
          callback(list.filter(s => s.expiresAt > Date.now()));
        });
    },

    offStories() { db().ref('/stories').off(); },

    markStorySeen(storyId, username) {
      return db().ref(`/stories/${storyId}/seen/${username}`).set(true);
    },

    /* ── Friend requests ── */
    sendRequest(toUsername, data) {
      return db().ref(`/requests/${toUsername}/${data.from}`).set(data);
    },

    watchRequests(username, callback) {
      db().ref(`/requests/${username}`).on('value', snap => {
        const list = [];
        snap.forEach(c => list.push(c.val()));
        callback(list);
      });
    },

    offRequests(username) { db().ref(`/requests/${username}`).off(); },

    removeRequest(toUsername, fromUsername) {
      return db().ref(`/requests/${toUsername}/${fromUsername}`).remove();
    },

    /* ── Utility ── */
    async getOnlineUser(username) {
      const snap = await db().ref(`/online/${username}`).get();
      return snap.exists() ? { username, ...snap.val() } : null;
    },

    timestamp: () => firebase.database.ServerValue.TIMESTAMP,
  };
})();
