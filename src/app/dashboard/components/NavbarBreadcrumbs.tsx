"use client";

import Link from "next/link";
import {
  Breadcrumbs,
  breadcrumbsClasses,
  styled,
  Typography,
} from "@mui/material";
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
    const parts = pathname.replace(/^\//, "").split("/");

    // Remove locale prefixes (km, en)
    return parts.filter((part) => part && !["km", "en"].includes(part));
  };

  const pathParts = formatPath(pathname);

  // Build cumulative URLs for each breadcrumb level
  const buildHref = (index: number) => {
    if (
      (pathParts[index - 1] === "exam" &&
        pathParts[index] === "monthly") ||
      pathParts[index] === "semester"
    ) {
      return "/" + pathParts.slice(0, index).join("/");
    }
    return "/" + pathParts.slice(0, index + 1).join("/");
  };

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {/* Always start with Dashboard */}
      <Link
        href="/"
        style={{
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            "&:hover": { color: "primary.main" },
          }}
        >
          Dashboard
        </Typography>
      </Link>

      {pathParts.map((item, index) => {
        const isLast = index === pathParts.length - 1;
        const href = buildHref(index);

        return isLast ? (
          // 🔹 Last item — not clickable
          <Typography
            key={index}
            variant="body1"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {item}
          </Typography>
        ) : (
          // 🔹 Clickable breadcrumb link
          <Link
            key={index}
            href={href}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                textTransform: "capitalize",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              {item}
            </Typography>
          </Link>
        );
      })}
    </StyledBreadcrumbs>
  );
}
