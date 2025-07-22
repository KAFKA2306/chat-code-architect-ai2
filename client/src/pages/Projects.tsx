import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@shared/schema";
import { 
  Plus, 
  Search, 
  Filter,
  Code,
  Database,
  MessageSquare,
  GitBranch,
  Shield,
  Globe
} from "lucide-react";

// Mock user ID - in production, this would come from authentication
const CURRENT_USER_ID = 1;

const PROJECT_TEMPLATES = [
  {
    id: 'rest-api',
    name: 'REST API with Authentication',
    description: 'Complete REST API with user authentication, JWT tokens, and CRUD operations',
    techStack: ['FastAPI', 'PostgreSQL', 'JWT', 'Docker'],
    icon: Shield,
    category: 'API'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Backend',
    description: 'Full e-commerce API with products, orders, payments, and inventory management',
    techStack: ['Node.js', 'MongoDB', 'Stripe', 'Redis'],
    icon: Database,
    category: 'E-commerce'
  },
  {
    id: 'chat-system',
    name: 'Real-time Chat System',
    description: 'WebSocket-based chat with rooms, message history, and user presence',
    techStack: ['Socket.io', 'Express', 'MongoDB', 'Redis'],
    icon: MessageSquare,
    category: 'Real-time'
  },
  {
    id: 'microservices',
    name: 'Microservices Architecture',
    description: 'Distributed microservices with API gateway, service discovery, and monitoring',
    techStack: ['Docker', 'Kubernetes', 'PostgreSQL', 'Redis'],
    icon: GitBranch,
    category: 'Architecture'
  },
  {
    id: 'graphql-api',
    name: 'GraphQL API',
    description: 'Modern GraphQL API with subscriptions, mutations, and real-time updates',
    techStack: ['GraphQL', 'Apollo', 'PostgreSQL', 'TypeScript'],
    icon: Code,
    category: 'API'
  },
  {
    id: 'cms-backend',
    name: 'Content Management System',
    description: 'Headless CMS with content modeling, media management, and API endpoints',
    techStack: ['Strapi', 'PostgreSQL', 'S3', 'Docker'],
    icon: Globe,
    category: 'CMS'
  }
];

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch user projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: [`/api/projects?userId=${CURRENT_USER_ID}`],
  });

  // Filter projects based on search and category
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           project.status === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "planning", "building", "completed", "error"];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Manage your backend projects and explore templates
            </p>
          </div>
          <Link href="/chat">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Projects" : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Tabs defaultValue="my-projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-projects">My Projects</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(1).map((status) => {
                const count = projects.filter((p: any) => p.status === status).length;
                return (
                  <Card key={status}>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-muted/20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {projects.length === 0 ? "No projects yet" : "No projects match your search"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {projects.length === 0 
                      ? "Start building your first backend project with AI"
                      : "Try adjusting your search or filters"
                    }
                  </p>
                  <Link href="/chat">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Project Templates</h2>
              <p className="text-muted-foreground">
                Start with battle-tested templates for common backend patterns
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROJECT_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {template.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.techStack.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                      <Link href={`/chat?template=${template.id}`}>
                        <Button className="w-full" size="sm">
                          <Plus className="w-3 h-3 mr-2" />
                          Use Template
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
