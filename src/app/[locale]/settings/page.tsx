import SubjectSettings from "@/app/dashboard/components/Common/SubjectSettings";
import { Box, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import React from "react";

export default function Page() {
  const t = useTranslations();
  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box display={"flex"} mb={2} gap={1} justifyContent={"space-between"}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {t("MenuList.setting")}
          </Typography>
        </Box>

        <Box p={3} sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          <Typography
            component="h4"
            variant="subtitle2"
            gutterBottom
          >
            {t("MenuList.manageSubject")}
          </Typography>
          <Typography
            component="address"
            variant="caption"
            color="error"
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi impedit, repudiandae tempora velit nostrum blanditiis maxime veritatis temporibus consequatur cumque?
          </Typography>

          <Box>
            <SubjectSettings />
          </Box>
        </Box>
      </Box>
    </>
  );
}
