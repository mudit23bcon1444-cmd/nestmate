import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
  UserX,
  UserCheck,
  IndianRupee,
  MapPin,
  ArrowLeft,
  Home as HomeIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'users' | 'logs'
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // 1. Fetch Listings
  const { data: listingsData, isLoading: loadingListings } = useQuery({
    queryKey: ['admin-listings'],
    queryFn: async () => {
      const res = await api.get('/api/admin/listings');
      return res.data;
    },
  });

  // 2. Fetch Users
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/api/admin/users');
      return res.data;
    },
  });

  // 3. Fetch Logs
  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const res = await api.get('/api/admin/logs');
      return res.data;
    },
  });

  // Approval Mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ listingId, is_approved, verification_notes }) => {
      const res = await api.patch(`/api/admin/listings/${listingId}`, {
        is_approved,
        verification_notes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setActionSuccess(data.message || 'Listing verification updated successfully.');
      setActionError('');
      queryClient.invalidateQueries(['admin-listings']);
      queryClient.invalidateQueries(['admin-logs']);
    },
    onError: (err) => {
      setActionError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to update approval.'
      );
    },
  });

  // User Suspension Toggle Mutation
  const userStatusMutation = useMutation({
    mutationFn: async ({ userId, is_active }) => {
      const res = await api.patch(`/api/admin/users/${userId}/status`, { is_active });
      return res.data;
    },
    onSuccess: (data) => {
      setActionSuccess(data.message || 'User status updated successfully.');
      setActionError('');
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-logs']);
    },
    onError: (err) => {
      setActionError(
        err.response?.data?.error || err.response?.data?.message || 'Failed to update user status.'
      );
    },
  });

  const allListings = listingsData?.listings || [];
  const pendingListings = allListings.filter((l) => Number(l.is_approved) === 0);
  const users = usersData?.users || [];
  const logs = logsData?.logs || [];

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ─── Top Admin Header matching admin_panel_nestmate_refined ─────────── */}
      <header className="bg-surface rounded-2xl p-6 border border-outline-variant/30 sharp-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 h-4 w-4" />
            <input
              type="text"
              placeholder="Search properties, user accounts, or logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low/60 border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            to="/"
            className="border border-outline-variant/40 hover:border-primary/40 text-on-surface hover:text-primary text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
            title="Return to NestMate Homepage"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">Superadmin Console</p>
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Admin Portal</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm">
            A
          </div>
        </div>
      </header>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-xs text-secondary font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ─── 4 Stat Overview Cards matching admin template ───────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl sharp-shadow border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Total Users</p>
            <span className="text-tertiary font-bold text-[11px] bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <h3 className="font-heading font-bold text-2xl text-on-surface">{users.length}</h3>
            <span className="material-symbols-outlined text-primary/70 text-[24px]">group</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl sharp-shadow border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Total Listings</p>
            <span className="text-tertiary font-bold text-[11px] bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">+5.2%</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <h3 className="font-heading font-bold text-2xl text-on-surface">{allListings.length}</h3>
            <span className="material-symbols-outlined text-primary/70 text-[24px]">home</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl sharp-shadow border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Pending Approvals</p>
            <span className="text-amber-600 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full">
              {pendingListings.length}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <h3 className="font-heading font-bold text-2xl text-on-surface">{pendingListings.length}</h3>
            <span className="material-symbols-outlined text-amber-500 text-[24px]">pending_actions</span>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl sharp-shadow border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">System Audit Logs</p>
            <span className="text-tertiary font-bold text-[11px] bg-tertiary-fixed/30 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <h3 className="font-heading font-bold text-2xl text-on-surface">{logs.length}</h3>
            <span className="material-symbols-outlined text-tertiary text-[24px]">history</span>
          </div>
        </div>
      </section>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex p-1 bg-surface rounded-2xl border border-outline-variant/30 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Verification Queue ({pendingListings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2 px-5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          User Accounts ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-5 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'logs'
              ? 'bg-primary text-white shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Audit Logs ({logs.length})
        </button>
      </div>

      {/* ─── Tab 1: Verification Queue ───────────────────────────────────────── */}
      {activeTab === 'pending' && (
        <section className="bg-surface rounded-2xl sharp-shadow border border-outline-variant/20 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/20 flex justify-between items-center">
            <h3 className="font-heading font-bold text-base text-on-surface">Physical Verification Queue</h3>
            <span className="text-xs text-on-surface-variant">Review photos and coordinates</span>
          </div>

          {loadingListings ? (
            <div className="p-8 text-center text-xs text-on-surface-variant animate-pulse">Loading queue...</div>
          ) : pendingListings.length === 0 ? (
            <div className="p-16 text-center text-xs text-on-surface-variant space-y-2">
              <span className="material-symbols-outlined text-4xl text-secondary">check_circle</span>
              <p className="font-bold text-on-surface">Queue is clear!</p>
              <p>All submitted listings have been physically verified.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {pendingListings.map((prop) => {
                const displayImage =
                  (prop.images && prop.images[0]) ||
                  prop.image_path ||
                  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80';

                return (
                  <div key={prop._id || prop.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:bg-surface-container-low/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-18 rounded-xl overflow-hidden bg-surface-container shrink-0 border border-outline-variant/20">
                        <img src={displayImage} alt="" className="w-full h-full object-cover" />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-primary">{prop.room_type || 'Room'}</span>
                        <h4 className="font-heading font-bold text-sm text-on-surface">{prop.title}</h4>
                        <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{prop.location}</span>
                        </p>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium pt-1">
                          <span className="text-primary font-bold">₹{Number(prop.price).toLocaleString('en-IN')}/mo</span>
                          <span>Host: {prop.owner_name || 'Landlord'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        disabled={approvalMutation.isPending}
                        onClick={() =>
                          approvalMutation.mutate({
                            listingId: prop._id || prop.id,
                            is_approved: 1,
                            verification_notes: 'Physical check & photos confirmed by Admin.',
                          })
                        }
                        className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-primary-container flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Approve & Verify</span>
                      </button>

                      <button
                        type="button"
                        disabled={approvalMutation.isPending}
                        onClick={() =>
                          approvalMutation.mutate({
                            listingId: prop._id || prop.id,
                            is_approved: 2,
                            verification_notes: 'Did not meet authenticity guidelines.',
                          })
                        }
                        className="px-3 py-2 bg-surface border border-outline-variant text-xs font-semibold rounded-xl hover:bg-error/10 hover:text-error flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <Link
                        to={`/property/${prop._id || prop.id}`}
                        className="p-2 rounded-xl border border-outline-variant hover:bg-surface-container text-on-surface"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ─── Tab 2: User Accounts & Suspension ───────────────────────────────── */}
      {activeTab === 'users' && (
        <section className="bg-surface rounded-2xl sharp-shadow border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">User Account</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Listings Owned</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Account State</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map((u) => {
                  const isActive = u.is_active !== false;

                  return (
                    <tr key={u._id || u.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-on-surface">{u.name || 'Member'}</p>
                        <p className="text-[11px] text-on-surface-variant">{u.email || u.phone}</p>
                      </td>

                      <td className="px-5 py-4 capitalize font-semibold text-on-surface">
                        {u.role || 'student'}
                      </td>

                      <td className="px-5 py-4 font-medium text-on-surface">
                        {u.listing_count || 0} accommodations
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                          }`}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          disabled={userStatusMutation.isPending}
                          onClick={() =>
                            userStatusMutation.mutate({
                              userId: u._id || u.id,
                              is_active: !isActive,
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 transition-all ${
                            isActive
                              ? 'border border-error/30 text-error hover:bg-error hover:text-white'
                              : 'border border-secondary/30 text-secondary hover:bg-secondary hover:text-white'
                          }`}
                        >
                          {isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                          <span>{isActive ? 'Suspend' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Tab 3: Audit Trail Logs ─────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <section className="bg-surface rounded-2xl sharp-shadow border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-surface-container-low font-sans text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Action Description</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Admin Moderator</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id || log.id} className="hover:bg-surface-container-low/30">
                    <td className="px-5 py-3.5 font-sans font-medium text-on-surface">{log.action}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">{log.admin_name || 'System'}</td>
                    <td className="px-5 py-3.5 text-right text-on-surface-variant">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
