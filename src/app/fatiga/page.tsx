"use client";

import withRoleProtection from "@/components/withRoleProtection";
import PageContent from "./PageContent";

export default withRoleProtection(PageContent, ["admin","controlador"]);
