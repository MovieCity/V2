import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Nav } from "@/components/nav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AnimePage from "@/pages/anime/[id]";
import EpisodePage from "@/pages/anime/episode/[id]";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path={`/dashboard-${import.meta.env.VITE_ADMIN_SECRET}`} component={Admin} />
      <Route path="/anime/:id" component={AnimePage} />
      <Route path="/anime/episode/:id" component={EpisodePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Nav />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;