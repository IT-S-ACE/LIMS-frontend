import type { Role } from "@/lib/types";

type AccessRule = {
  matches: (path: string) => boolean;
  roles: Role[];
};

const staff: Role[] = ["admin", "receptionist", "technician"];
const everyone: Role[] = [...staff, "patient"];

const rules: AccessRule[] = [
  { matches: (path) => path === "/portal", roles: ["patient"] },
  { matches: (path) => path === "/settings", roles: ["admin"] },
  { matches: (path) => path === "/audit", roles: ["admin"] },
  { matches: (path) => path.startsWith("/finance/payments"), roles: ["admin", "receptionist"] },
  { matches: (path) => path.startsWith("/finance"), roles: ["admin"] },
  { matches: (path) => path === "/reports/inventory", roles: ["admin"] },
  { matches: (path) => path.startsWith("/insurance"), roles: ["admin"] },
  { matches: (path) => path === "/inventory/reagents/new", roles: ["admin"] },
  { matches: (path) => path.startsWith("/inventory"), roles: ["admin", "technician"] },
  {
    matches: (path) =>
      path === "/tests/new" || (path.startsWith("/tests/") && path.endsWith("/edit")),
    roles: ["admin"],
  },
  { matches: (path) => path.startsWith("/tests"), roles: staff },
  { matches: (path) => path === "/samples/new", roles: ["admin", "receptionist"] },
  { matches: (path) => path.startsWith("/samples"), roles: staff },
  { matches: (path) => path.startsWith("/results"), roles: ["admin", "technician"] },
  { matches: (path) => path.startsWith("/reports"), roles: staff },
  { matches: (path) => path.startsWith("/patients"), roles: ["admin", "receptionist"] },
  { matches: (path) => path.startsWith("/test-requests"), roles: ["admin", "receptionist"] },
  { matches: (path) => path === "/dashboard", roles: staff },
  { matches: (path) => path === "/profile" || path === "/notifications", roles: everyone },
];

export function canAccessPath(role: Role, path: string): boolean {
  const rule = rules.find((candidate) => candidate.matches(path));
  return rule ? rule.roles.includes(role) : true;
}

export function defaultRouteForRole(role: Role): "/portal" | "/dashboard" {
  return role === "patient" ? "/portal" : "/dashboard";
}
