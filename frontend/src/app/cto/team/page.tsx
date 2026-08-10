'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { Progress } from '@/components/UI/Progress';
import {
  Users,
  Plus,
  Search,
  Mail,
  Calendar,
  TrendingUp,
  Target,
  Award,
  Clock,
  Code2,
  GitBranch,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// Mock team data
const teamMembers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@techos.com',
    role: 'Senior Engineer',
    avatar: null,
    status: 'active',
    performance: 92,
    tasksCompleted: 45,
    tasksTotal: 50,
    commits: 247,
    prsReviewed: 32,
    expertise: ['React', 'Node.js', 'TypeScript'],
    joined: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@techos.com',
    role: 'Tech Lead',
    avatar: null,
    status: 'active',
    performance: 96,
    tasksCompleted: 38,
    tasksTotal: 40,
    commits: 189,
    prsReviewed: 54,
    expertise: ['Python', 'DevOps', 'AWS'],
    joined: '2023-06-10',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike.c@techos.com',
    role: 'Frontend Developer',
    avatar: null,
    status: 'active',
    performance: 88,
    tasksCompleted: 42,
    tasksTotal: 48,
    commits: 312,
    prsReviewed: 28,
    expertise: ['React', 'Vue.js', 'CSS'],
    joined: '2024-03-20',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.d@techos.com',
    role: 'Backend Developer',
    avatar: null,
    status: 'active',
    performance: 90,
    tasksCompleted: 35,
    tasksTotal: 42,
    commits: 201,
    prsReviewed: 19,
    expertise: ['Node.js', 'PostgreSQL', 'Redis'],
    joined: '2023-11-05',
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    email: 'alex.r@techos.com',
    role: 'DevOps Engineer',
    avatar: null,
    status: 'active',
    performance: 94,
    tasksCompleted: 28,
    tasksTotal: 30,
    commits: 156,
    prsReviewed: 15,
    expertise: ['Docker', 'Kubernetes', 'CI/CD'],
    joined: '2024-02-01',
  },
];

export default function CTOTeamPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = teamMembers.length;
  const avgPerformance = Math.round(teamMembers.reduce((sum, m) => sum + m.performance, 0) / totalMembers);
  const totalCommits = teamMembers.reduce((sum, m) => sum + m.commits, 0);
  const totalPRs = teamMembers.reduce((sum, m) => sum + m.prsReviewed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Engineering Team</h1>
          <p className="text-ink-muted mt-2">Team members and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/cto/team/hiring')}>
            Open Positions
          </Button>
          <Button onClick={() => router.push('/cto/team/members/invite')}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink-muted">Team Size</span>
          </div>
          <p className="text-3xl font-bold text-ink">{totalMembers}</p>
          <p className="text-xs text-success mt-2">+2 from last quarter</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">Avg Performance</span>
          </div>
          <p className="text-3xl font-bold text-ink">{avgPerformance}%</p>
          <p className="text-xs text-success mt-2">+3% from last month</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <GitBranch className="h-4 w-4 text-info" />
            <span className="text-sm text-ink-muted">Total Commits</span>
          </div>
          <p className="text-3xl font-bold text-ink">{totalCommits}</p>
          <p className="text-xs text-info mt-2">This month</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm text-ink-muted">PRs Reviewed</span>
          </div>
          <p className="text-3xl font-bold text-ink">{totalPRs}</p>
          <p className="text-xs text-success mt-2">This month</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6 bg-surface border border-border">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-muted border border-border rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="p-6 bg-bg-muted border border-border cursor-pointer hover:border-brand/40 transition-all"
              onClick={() => router.push(`/cto/team/members/${member.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-brand">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{member.name}</h3>
                    <p className="text-sm text-ink-muted">{member.role}</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <Mail className="h-4 w-4 text-ink-muted" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-secondary">
                  <Calendar className="h-4 w-4 text-ink-muted" />
                  <span>Joined {new Date(member.joined).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-muted">Performance</span>
                    <Badge variant={member.performance >= 90 ? 'success' : member.performance >= 75 ? 'info' : 'warning'}>
                      {member.performance}%
                    </Badge>
                  </div>
                  <Progress value={member.performance} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-ink-muted">Task Completion</span>
                    <span className="text-xs text-ink">
                      {member.tasksCompleted}/{member.tasksTotal}
                    </span>
                  </div>
                  <Progress value={(member.tasksCompleted / member.tasksTotal) * 100} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2 bg-surface border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <GitBranch className="h-3 w-3 text-info" />
                    <span className="text-xs text-ink-muted">Commits</span>
                  </div>
                  <p className="font-semibold text-ink">{member.commits}</p>
                </div>
                <div className="p-2 bg-surface border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-xs text-ink-muted">PRs</span>
                  </div>
                  <p className="font-semibold text-ink">{member.prsReviewed}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-ink-muted mb-2">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {member.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-brand-soft text-brand text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="p-6 bg-surface border border-border cursor-pointer hover:border-brand/40 transition-all"
          onClick={() => router.push('/cto/team/performance')}
        >
          <Award className="h-8 w-8 text-brand mb-4" />
          <h3 className="font-semibold text-ink mb-2">Performance Reviews</h3>
          <p className="text-sm text-ink-muted">View team performance metrics</p>
        </Card>
        <Card
          className="p-6 bg-surface border border-border cursor-pointer hover:border-brand/40 transition-all"
          onClick={() => router.push('/cto/team/workload')}
        >
          <TrendingUp className="h-8 w-8 text-success mb-4" />
          <h3 className="font-semibold text-ink mb-2">Workload Analysis</h3>
          <p className="text-sm text-ink-muted">Balance team capacity</p>
        </Card>
        <Card
          className="p-6 bg-surface border border-border cursor-pointer hover:border-brand/40 transition-all"
          onClick={() => router.push('/cto/team/hiring')}
        >
          <Users className="h-8 w-8 text-info mb-4" />
          <h3 className="font-semibold text-ink mb-2">Hiring Pipeline</h3>
          <p className="text-sm text-ink-muted">Manage open positions</p>
        </Card>
      </div>
    </div>
  );
}
