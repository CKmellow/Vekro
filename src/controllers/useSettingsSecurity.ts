import { useState } from 'react'
import { useNavigate } from 'react-router'
import { passwordStrength, PASSWORD_RULES } from '@/lib/password'
import { formatRelative } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import {
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '@/models/queries/account'
import { useSignOut } from '@/models/queries/session'

const ACTIVE_MS = 10 * 60_000

/** S13 Security tab: change password, signed-in devices, sign out others, log out. */
export function useSettingsSecurity() {
  const navigate = useNavigate()
  const sessions = useSessions()
  const change = useChangePassword()
  const revoke = useRevokeSession()
  const revokeOthers = useRevokeOtherSessions()
  const signOut = useSignOut()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [tried, setTried] = useState(false)
  const [wrongCurrent, setWrongCurrent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rulesMet = PASSWORD_RULES.every((r) => r.test(next))
  const errors = {
    current: !current
      ? 'Enter your current password'
      : wrongCurrent
        ? "That password doesn't match"
        : undefined,
    next: !rulesMet ? 'Use 8 or more characters with a letter and a number' : undefined,
    confirm: confirm !== next ? "Passwords don't match" : undefined,
  }

  const update = async () => {
    setTried(true)
    setError(null)
    if (errors.next || errors.confirm || !current) return
    try {
      const signedOut = await change.mutateAsync({ current, next })
      setCurrent('')
      setNext('')
      setConfirm('')
      setTried(false)
      toast.show(
        signedOut > 0
          ? `Password updated. ${signedOut} other ${signedOut === 1 ? 'device was' : 'devices were'} signed out.`
          : 'Password updated',
        'success',
      )
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) setWrongCurrent(true)
      else
        setError(
          e instanceof ApiError && e.kind === 'network'
            ? "You're offline. Try again when you're connected."
            : "We couldn't update your password. Try again.",
        )
    }
  }

  const now = new Date()
  const list = sessions.data ?? []
  return {
    current,
    setCurrent: (v: string) => {
      setCurrent(v)
      setWrongCurrent(false)
    },
    next,
    setNext,
    confirm,
    setConfirm,
    strength: next ? passwordStrength(next) : undefined,
    rules: PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, met: r.test(next) })),
    errors: tried || wrongCurrent ? errors : ({} as Partial<typeof errors>),
    update: () => void update(),
    updating: change.isPending,
    error,
    sessionsState: sessions.data
      ? ('ready' as const)
      : sessions.isError
        ? ('error' as const)
        : ('loading' as const),
    retrySessions: () => void sessions.refetch(),
    devices: list.map((s) => ({
      id: s.id,
      device: s.device,
      current: s.current,
      seen:
        s.current || now.getTime() - new Date(s.lastSeenAt).getTime() < ACTIVE_MS
          ? 'Active now'
          : `Last active ${formatRelative(s.lastSeenAt, now).toLowerCase()}`,
    })),
    hasOthers: list.some((s) => !s.current),
    revoking: revoke.isPending ? revoke.variables : null,
    revoke: (id: string) =>
      revoke.mutate(id, {
        onSuccess: () => toast.show('Device signed out', 'success'),
        onError: () => toast.show("We couldn't sign that device out. Try again.", 'danger'),
      }),
    revokeOthers: () =>
      revokeOthers.mutate(undefined, {
        onSuccess: (n) => toast.show(`${n} other ${n === 1 ? 'device' : 'devices'} signed out`, 'success'),
        onError: () => toast.show("We couldn't sign out your other devices. Try again.", 'danger'),
      }),
    revokingOthers: revokeOthers.isPending,
    logOut: () => signOut.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) }),
    loggingOut: signOut.isPending,
  }
}
