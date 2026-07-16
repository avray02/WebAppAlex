import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Activity, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from './authContext'

const loginSchema = z.object({
  email: z.email('Email invalide'),
  password: z.string().min(6, '6 caracteres minimum'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { user, signIn, authMode } = useAuth()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: LoginForm) {
    setError('')

    try {
      await signIn(values.email, values.password)
    } catch {
      setError('Connexion impossible avec ces identifiants.')
    }
  }

  return (
    <main className="login-page">
      <motion.section
        className="login-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="login-brand">
          <span className="brand-mark">
            <Activity size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Private platform</p>
            <h1>Athletic Performance</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
          <label>
            <span>Email</span>
            <div className="input-shell">
              <Mail size={18} aria-hidden="true" />
              <input type="email" autoComplete="email" {...register('email')} />
            </div>
            {errors.email ? <small>{errors.email.message}</small> : null}
          </label>

          <label>
            <span>Mot de passe</span>
            <div className="input-shell">
              <Lock size={18} aria-hidden="true" />
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </div>
            {errors.password ? <small>{errors.password.message}</small> : null}
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {authMode === 'demo' ? 'Entrer en mode demo' : 'Connexion'}
          </button>
        </form>
      </motion.section>
    </main>
  )
}
