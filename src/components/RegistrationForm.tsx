'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import api from '@/lib/axios';
import OAuthButtons from './OAuthButtons';

interface RegistrationFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegistrationForm() {
  const { locale } = useParams() as { locale: string };
  const tAuth = useTranslations('auth');
  const tRegister = useTranslations('auth.register');

  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Username, email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/register/', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      // Registration no longer auto-logs-in — the account is unverified
      // until the confirmation link is clicked, so show a "check your
      // email" message instead of redirecting to login.
      setRegistered(true);
    } catch (err: unknown) {
      if (
        isAxiosError(err) &&
        err.response?.data != null &&
        typeof err.response.data.email?.[0] === 'string'
      ) {
        setError(err.response.data.email[0]);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">{tRegister('checkEmailTitle')}</h1>
        <p className="text-green-700">{tRegister('checkEmailMessage')}</p>
        <p className="mt-4 text-center">
          <Link href={`/${locale}/auth/login`} className="text-blue-500 hover:underline">
            {tAuth('resetPassword.goToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block mb-1 font-medium">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1 font-medium">
            {tAuth('emailLabel')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded text-white transition ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? 'Registering…' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center">
        Already have an account?{' '}
        <Link href={`/${locale}/auth/login`} className="text-blue-500 hover:underline">
          Login here
        </Link>
      </p>

      <OAuthButtons />
    </div>
  );
}
