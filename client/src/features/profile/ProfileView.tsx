import { useEffect, useState } from 'react';
import type { User } from '../../models';
import type { ApiClient } from '../../services/apiClient';

type ProfileViewProps = {
  user: User;
  api: ApiClient;
};

export function ProfileView({ user, api }: ProfileViewProps) {
  const [profile, setProfile] = useState<User>(user);

  useEffect(() => {
    api.profile().then(setProfile).catch(() => setProfile(user));
  }, [api, user]);

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-500">Email</dt>
          <dd className="font-medium">{profile.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Role</dt>
          <dd className="font-medium">{profile.role}</dd>
        </div>
      </dl>
    </section>
  );
}
