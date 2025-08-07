import * as React from "react";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Breadcrumbs, { breadcrumbsClasses } from "@mui/material/Breadcrumbs";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import { usePathname } from "next/navigation";

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: "center",
  },
}));

export default function NavbarBreadcrumbs() {
  const pathname = usePathname();
  const formatPath = (pathname: string) => {
    return pathname.replace(/^\//, "").split("/");
  };
  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1">Dashboard</Typography>
      {formatPath(pathname).map((item) => (
        <Typography
        variant="body1"
        sx={{
          color: "text.primary",
          fontWeight: 600,
          textTransform: "capitalize",
        }}
      >
        {item === "" ? "Home" : item}
      </Typography>
      ))}

      
    </StyledBreadcrumbs>
  );
}
