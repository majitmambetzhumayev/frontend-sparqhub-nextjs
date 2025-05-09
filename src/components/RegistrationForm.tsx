'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';

interface RegistrationFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegistrationForm() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };

  const [formData, setFormData] = useState<RegistrationFormData>({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
    if (!formData.username.trim() || !formData.password) {
      setError('Username and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/auth/register/', {
        username: formData.username.trim(),
        password: formData.password,
      });
      // After registration, redirect to login page
      router.push(`/${locale}/auth/login`);
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    </div>
  );
}
