"use client";

import DashboardLayout from "@/app/dashboard/DashboardLayout";
import { Box, Typography } from "@mui/material";

export default function Page() {


  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
          Overview
        </Typography>
        <Box className="font-siemreap" sx={{ height: 400, width: "100%" }}>
          
        </Box>
      </Box>
    </>
  );
}
