import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  FolderTree, 
  Users,
  Menu, 
  LogOut,
  Settings,
  User,
  Home as HomeIcon
} from 'lucide-react';
import { logoutUser } from '@/lib/firebase';

const Header = ({ user }) => {
  const [_, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const getInitials = (displayName) => {
    if (!displayName) return '?';
    
    const names = displayName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };
  
  const navItems = [
    { name: 'Home', path: '/', icon: <HomeIcon className="h-5 w-5 mr-2" /> },
    { name: 'Family Tree', path: '/family-tree', icon: <FolderTree className="h-5 w-5 mr-2" /> },
    { name: 'Family Groups', path: '/family-groups', icon: <Users className="h-5 w-5 mr-2" /> },
  ];
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <FolderTree className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-semibold text-gray-900">AncesTREE</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              href={item.path}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center">
          {/* User Menu - Desktop */}
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {user.photoURL ? (
                        <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                      ) : (
                        <AvatarFallback className="bg-primary-light text-primary">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.displayName && (
                        <p className="font-medium">{user.displayName}</p>
                      )}
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:block">
              <Link href="/">
                <Button variant="default" className="bg-primary hover:bg-primary-dark text-white">
                  Log in
                </Button>
              </Link>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>AncesTREE</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  {user && (
                    <div className="flex items-center mb-6 pb-6 border-b">
                      <Avatar className="h-10 w-10 mr-3">
                        {user.photoURL ? (
                          <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                        ) : (
                          <AvatarFallback className="bg-primary-light text-primary">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        {user.displayName && (
                          <p className="font-medium">{user.displayName}</p>
                        )}
                        {user.email && (
                          <p className="text-sm text-gray-500">{user.email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <nav className="flex flex-col space-y-3">
                    {navItems.map(item => (
                      <Link 
                        key={item.path} 
                        href={item.path}
                        className="flex items-center px-2 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon} {item.name}
                      </Link>
                    ))}
                    
                    {user ? (
                      <>
                        <Link 
                          href="/profile"
                          className="flex items-center px-2 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User className="h-5 w-5 mr-2" /> Profile
                        </Link>
                        <Link 
                          href="/settings"
                          className="flex items-center px-2 py-2 text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5 mr-2" /> Settings
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center px-2 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors w-full text-left"
                        >
                          <LogOut className="h-5 w-5 mr-2" /> Log out
                        </button>
                      </>
                    ) : (
                      <Link 
                        href="/"
                        className="flex items-center px-2 py-2 text-base font-medium text-primary hover:bg-primary-light rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;