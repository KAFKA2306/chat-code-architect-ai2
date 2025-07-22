import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Folder, 
  Database, 
  Settings,
  Bot,
  User
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/chat", icon: MessageSquare, label: "Chat" },
    { href: "/projects", icon: Folder, label: "Projects" },
    { href: "/databases", icon: Database, label: "Databases" },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Code Architect</h1>
              <p className="text-xs text-muted-foreground">AI Backend Builder</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                             (item.href === "/chat" && location.startsWith("/chat"));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80" alt="Developer" />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">KAFKA2306</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
            </div>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
