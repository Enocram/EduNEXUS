// ========== SANITIZAÇÃO E VALIDAÇÃO ==========
const Sanitize = {
  // Sanitizar HTML (evitar XSS)
  html(str) {
    if (str === undefined || str === null) return '';
    const s = String(str);
    return s.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
      return c; // mantém emojis
    });
  },

  // Sanitizar string para uso em texto (já seguro)
  text(str) {
    if (str === undefined || str === null) return '';
    return String(str).trim();
  },

  // Validar email
  email(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(String(email).toLowerCase());
  },

  // Validar URL
  url(url) {
    try {
      new URL(url);
      return true;
    } catch { return false; }
  },

  // Sanitizar ID numérico
  id(id) {
    const num = parseInt(id);
    return isNaN(num) ? null : num;
  },

  // Escapar string para uso em atributos
  attr(str) {
    if (str === undefined || str === null) return '';
    const s = String(str);
    return s.replace(/[&"]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '"') return '&quot;';
      return m;
    });
  }
};

window.Sanitize = Sanitize;