/* éphémère — Data Layer (localStorage) */
const DB = (() => {
  const parse  = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const store  = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const remove = k => localStorage.removeItem(k);

  return {
    /* ---- Users ---- */
    users: {
      all()              { return parse('ep_users')  || []; },
      save(list)         { store('ep_users', list); },
      find(id)           { return this.all().find(u => u.id === id) || null; },
      byUsername(name)   { return this.all().find(u => u.username.toLowerCase() === name.toLowerCase()) || null; },
      update(id, patch)  {
        const list = this.all();
        const i = list.findIndex(u => u.id === id);
        if (i < 0) return null;
        list[i] = { ...list[i], ...patch };
        this.save(list);
        return list[i];
      },
      add(user)          {
        const list = this.all();
        list.push(user);
        this.save(list);
        return user;
      }
    },

    /* ---- Session ---- */
    session: {
      get()      { return parse('ep_session'); },
      set(id)    { store('ep_session', id); },
      clear()    { remove('ep_session'); }
    },

    /* ---- Messages ---- */
    messages: {
      all()           { return parse('ep_messages') || []; },
      save(list)      { store('ep_messages', list); },
      between(a, b)   {
        return this.all().filter(m =>
          (m.from === a && m.to === b) || (m.from === b && m.to === a)
        );
      },
      add(msg) {
        const list = this.all();
        list.push(msg);
        this.save(list);
        return msg;
      },
      update(id, patch) {
        const list = this.all();
        const i = list.findIndex(m => m.id === id);
        if (i < 0) return;
        list[i] = { ...list[i], ...patch };
        this.save(list);
      }
    },

    /* ---- Stories ---- */
    stories: {
      all()       { return parse('ep_stories') || []; },
      save(list)  { store('ep_stories', list); },
      active()    {
        const now = Date.now();
        return this.all().filter(s => s.expiresAt > now);
      },
      add(story) {
        const list = this.all();
        list.push(story);
        this.save(list);
        return story;
      },
      markSeen(storyId, userId) {
        const list = this.all();
        const i = list.findIndex(s => s.id === storyId);
        if (i < 0) return;
        if (!list[i].seen) list[i].seen = [];
        if (!list[i].seen.includes(userId)) list[i].seen.push(userId);
        this.save(list);
      }
    },

    /* ---- Friend requests ---- */
    requests: {
      all()       { return parse('ep_requests') || []; },
      save(list)  { store('ep_requests', list); },
      add(req)    {
        const list = this.all();
        list.push(req);
        this.save(list);
      },
      remove(from, to) {
        const list = this.all().filter(r => !(r.from === from && r.to === to));
        this.save(list);
      }
    },

    /* ---- Streaks ---- */
    streaks: {
      _key(a, b) { return [a, b].sort().join('|'); },
      get(a, b)  {
        const all = parse('ep_streaks') || {};
        return all[this._key(a, b)] || { count: 0, lastDate: null };
      },
      bump(a, b) {
        const all = parse('ep_streaks') || {};
        const key = this._key(a, b);
        const today = new Date().toDateString();
        const prev  = all[key] || { count: 0, lastDate: null };
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (prev.lastDate === today) return;
        all[key] = {
          count: prev.lastDate === yesterday ? prev.count + 1 : 1,
          lastDate: today
        };
        store('ep_streaks', all);
      }
    }
  };
})();
