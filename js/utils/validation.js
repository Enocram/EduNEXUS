// ========== VALIDAÇÃO DE FORMULÁRIOS ==========
const FormValidator = {
  rules: {
    required: (val) => val && val.trim() !== '',
    email: (val) => Sanitize.email(val),
    minLength: (val, len) => val && val.length >= len,
    maxLength: (val, len) => val && val.length <= len
  },

  validateField(value, rules) {
    const errors = [];
    for (const rule of rules) {
      if (typeof rule === 'string') {
        if (!this.rules[rule](value)) errors.push(rule);
      } else if (rule.name && rule.param) {
        if (!this.rules[rule.name](value, rule.param)) errors.push(`${rule.name}:${rule.param}`);
      }
    }
    return errors;
  },

  attachValidation(formId, onSubmitCallback) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;
      const data = {};
      
      for (const input of form.querySelectorAll('[data-validate]')) {
        const rules = input.dataset.validate.split(',');
        const value = input.value;
        const errors = this.validateField(value, rules);
        if (errors.length > 0) {
          isValid = false;
          this.showInputError(input, errors.join(', '));
        } else {
          this.hideInputError(input);
          data[input.name || input.id] = Sanitize.text(value);
        }
      }
      
      if (isValid && onSubmitCallback) {
        await onSubmitCallback(data, form);
      }
    });
  },

  showInputError(input, message) {
    const errorDiv = input.parentElement.querySelector('.input-error') || document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.innerText = message;
    if (!errorDiv.parentElement) input.parentElement.appendChild(errorDiv);
    input.classList.add('invalid');
  },

  hideInputError(input) {
    const errorDiv = input.parentElement.querySelector('.input-error');
    if (errorDiv) errorDiv.remove();
    input.classList.remove('invalid');
  }
};

window.FormValidator = FormValidator;