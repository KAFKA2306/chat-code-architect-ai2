import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  GitBranch, 
  Database, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Code
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'planning' | 'building' | 'completed' | 'error';
  techStack?: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: Project;
  compact?: boolean;
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'building':
        return <Play className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Code className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'building':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 hover:bg-accent/20 rounded-lg transition-colors">
        <div className="flex items-center space-x-3">
          {getStatusIcon(project.status)}
          <div>
            <h3 className="font-medium text-foreground">{project.name}</h3>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-md text-xs border ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription>
              {project.description || "No description available"}
            </CardDescription>
          </div>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs border ${getStatusColor(project.status)}`}>
            {getStatusIcon(project.status)}
            <span className="capitalize">{project.status}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.techStack.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        )}

        {/* Project Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link href={`/chat?project=${project.id}`}>
            <Button variant="outline" size="sm" className="flex-1">
              <Code className="w-3 h-3 mr-1" />
              Code
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="flex-1">
            <GitBranch className="w-3 h-3 mr-1" />
            Deploy
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
