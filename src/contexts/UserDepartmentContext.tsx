import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "officer" | "supervisor" | "admin" | "dispatcher";

export interface DepartmentProfile {
  id: string;
  name: string;
  logoUrl: string;
  theme: {
    primary: string;
    accent: string;
    background: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  rank: string;
  departmentId: string;
  badgeNumber?: string;
  email?: string;
}

interface UserDepartmentContextType {
  user: UserProfile;
  department: DepartmentProfile;
  setUser: (user: UserProfile) => void;
  setDepartment: (dept: DepartmentProfile) => void;
}

const defaultDepartment: DepartmentProfile = {
  id: "dept-001",
  name: "Baton Rouge PD",
  logoUrl: "/logo.png",
  theme: {
    primary: "#2563eb",
    accent: "#fbbf24",
    background: "#f8fafc"
  }
};

const defaultUser: UserProfile = {
  id: "user-001",
  name: "Alex Officer",
  avatarUrl: "https://ui-avatars.com/api/?name=Alex+Officer&background=0D8ABC&color=fff",
  role: "officer",
  rank: "officer",
  departmentId: "dept-001"
};

const UserDepartmentContext = createContext<UserDepartmentContextType | undefined>(undefined);

export const UserDepartmentProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [department, setDepartment] = useState<DepartmentProfile>(defaultDepartment);

  return (
    <UserDepartmentContext.Provider value={{ user, department, setUser, setDepartment }}>
      {children}
    </UserDepartmentContext.Provider>
  );
};

export const useUserDepartment = () => {
  const ctx = useContext(UserDepartmentContext);
  if (!ctx) throw new Error("useUserDepartment must be used within a UserDepartmentProvider");
  return ctx;
};