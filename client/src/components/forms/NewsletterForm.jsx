import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useForm, validators } from '../../hooks/useForm.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import { Input, Checkbox, Honeypot } from '../ui/Field.jsx';
import { Alert } from '../ui/Misc.jsx';

const NewsletterForm = ({ compact = true, inFooter = compact }) => {
  const toast = useToast();
  const [done, setDone] = useState(false);

  const form = useForm({
    initialValues: { email: '', firstName: '', consent: compact },
    rules: {
      email: [validators.required('Enter your email address.'), validators.email()],
      consent: [validators.required('Please confirm you want to receive emails.')],
    },
    onSubmit: async (values) => {
      await api.post('/newsletter', {
        ...values,
        sourcePath: window.location.pathname,
      });
      setDone(true);
      toast.success('You are subscribed. Look out for our next travel guide.');
    },
  });

  if (done) {
    return (
      <Alert variant="success" title="Thank you">
        You are on the list. We send a short guide roughly once a month and you can unsubscribe from any
        email.
      </Alert>
    );
  }

  return (
    <form
      className={`newsletter-form ${inFooter ? 'footer__newsletter-form' : ''}`.trim()}
      onSubmit={form.handleSubmit}
      noValidate
    >
      <Honeypot value={form.values._hp || ''} onChange={form.handleChange} />

      <Input
        {...form.fieldProps('email')}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        aria-label="Email address"
        required
      />
      <Button type="submit" variant="accent" loading={form.submitting}>
        Subscribe
      </Button>

      {!compact ? (
        <Checkbox
          {...form.checkboxProps('consent')}
          label="I agree to receive occasional travel guides and offers by email."
        />
      ) : null}

      {form.submitError ? (
        <div style={{ flexBasis: '100%' }}>
          <Alert variant="error">{form.submitError}</Alert>
        </div>
      ) : null}

      {compact ? (
        <p style={{ flexBasis: '100%', fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: 4 }}>
          By subscribing you agree to our privacy policy. Unsubscribe at any time.
        </p>
      ) : null}
    </form>
  );
};

export default NewsletterForm;
