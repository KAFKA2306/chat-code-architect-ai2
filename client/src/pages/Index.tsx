import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Code, Database, GitBranch, MessageSquare, Zap, Shield, Gauge } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Code Architect AI</h1>
                <p className="text-xs text-muted-foreground">AI Backend Builder</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <Link href="/chat">
                <Button>Start Building</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-6">
            <Zap className="w-3 h-3 mr-1" />
            AI-Powered Backend Generation
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Build Backends with Natural Language
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Generate production-ready backend APIs using AI. Just describe what you want to build, 
            and our AI architect will create complete, scalable applications with all the necessary files.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button size="lg" className="w-full sm:w-auto">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Building Now
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Code className="w-4 h-4 mr-2" />
                View Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build modern backend applications
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>AI Code Generation</CardTitle>
              <CardDescription>
                Describe your backend requirements in natural language and get complete, working code
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mb-2">
                <Database className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle>Database Integration</CardTitle>
              <CardDescription>
                Automatic database schema design and migration generation for PostgreSQL, MongoDB, and more
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <CardTitle>Security Built-in</CardTitle>
              <CardDescription>
                Authentication, authorization, input validation, and security best practices included by default
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center mb-2">
                <GitBranch className="w-5 h-5 text-orange-500" />
              </div>
              <CardTitle>CI/CD Ready</CardTitle>
              <CardDescription>
                Docker containers, GitHub Actions, and deployment configurations generated automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-2">
                <Code className="w-5 h-5 text-purple-500" />
              </div>
              <CardTitle>Multiple Tech Stacks</CardTitle>
              <CardDescription>
                Support for FastAPI, Node.js, Django, Express, and more with best practices for each
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-2">
                <Gauge className="w-5 h-5 text-blue-500" />
              </div>
              <CardTitle>Production Ready</CardTitle>
              <CardDescription>
                Error handling, logging, monitoring, and scalability patterns included from day one
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Supported Technologies</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate code for your favorite backend technologies
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {[
            'FastAPI', 'Node.js', 'Express.js', 'Django', 'Flask',
            'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
            'AWS', 'GCP', 'Azure', 'GitHub Actions', 'JWT',
            'REST API', 'GraphQL', 'WebSocket', 'Celery', 'RabbitMQ'
          ].map((tech) => (
            <Badge key={tech} variant="outline" className="px-3 py-1">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Build Your Backend?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are building faster with AI-powered code generation.
              Start your first project today.
            </p>
            <Link href="/chat">
              <Button size="lg">
                <Bot className="w-4 h-4 mr-2" />
                Start Building for Free
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Code Architect AI. Built with AI for developers.</p>
        </div>
      </footer>
    </div>
  );
}
