import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Project, ChatSession } from "@shared/schema";
import { 
  Plus, 
  MessageSquare, 
  Code, 
  Database, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// Mock user ID - in production, this would come from authentication
const CURRENT_USER_ID = 1;

export default function Dashboard() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects?userId=${CURRENT_USER_ID}`],
  });

  const { data: chatSessions = [] } = useQuery<ChatSession[]>({
    queryKey: [`/api/chat-sessions?userId=${CURRENT_USER_ID}`],
  });

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p: any) => p.status === 'building').length,
    completedProjects: projects.filter((p: any) => p.status === 'completed').length,
    totalChats: chatSessions.length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your projects.
            </p>
          </div>
          <div className="flex space-x-3">
            <Link href="/chat">
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                All time projects created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Builds</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Currently building
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">
                Ready for deployment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChats}</div>
              <p className="text-xs text-muted-foreground">
                AI conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>
                  Your latest backend projects and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-12">
                    <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start building your first backend project with AI
                    </p>
                    <Link href="/chat">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Project
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <ProjectCard key={project.id} project={project} compact />
                    ))}
                    {projects.length > 5 && (
                      <div className="text-center pt-4">
                        <Link href="/projects">
                          <Button variant="outline">View All Projects</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/chat">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start New Chat
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Database Tools
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chatSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {chatSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
