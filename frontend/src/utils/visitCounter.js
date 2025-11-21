export const ensureVisitorUid = () => {
  let uid = localStorage.getItem("visitor_uid");
  if (!uid) {
    uid = (crypto?.randomUUID?.() ||
      ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      ));
    localStorage.setItem("visitor_uid", uid);
  }
  return uid;
};

// Call this once per tab session
export const initVisitCounter = async (API_BASE) => {
  const uid = ensureVisitorUid();

  // Already counted in this tab session? stop.
  if (sessionStorage.getItem("visit_session_active")) return;

  // Mark session BEFORE request so refresh/login/logout won’t double count
  sessionStorage.setItem("visit_session_active", "1");

  try {
    await fetch(`${API_BASE}/api/visits/increment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorUid: uid })
    });
  } catch (err) {
    console.error("initVisitCounter error:", err);
  }
};