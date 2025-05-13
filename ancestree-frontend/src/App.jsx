import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import FamilyTree from "@/pages/FamilyTree";
import FamilyGroups from "@/pages/FamilyGroups";
import FamilyGroupView from "@/pages/FamilyGroupView";
import Header from "@/components/layout/Header";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/family-tree" component={FamilyTree} />
        <Route path="/family-groups" component={FamilyGroups} />
        <Route path="/family-groups/:id" component={FamilyGroupView} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;