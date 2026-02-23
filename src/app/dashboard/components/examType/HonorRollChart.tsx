"use client";
import {
  Typography,
  Paper,
  Avatar,
  Box,
  IconButton,
  Stack,
  Button,
  Badge,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import { useAtomValue } from "jotai";
import {
  classroomAtom,
  examAtom,
  top5StudentsAtom,
} from "@/app/libs/jotai/classroomAtom";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";

type HonorRollChartProps = {};

export const HonorRollChart = (props: HonorRollChartProps) => {
  // Get top 5 students from atom
  const top5: any = useAtomValue(top5StudentsAtom);
  const t = useTranslations("HonorRoll");
  const tc = useTranslations("Common");
  const exam = useAtomValue(examAtom);
  const classroom = useAtomValue(classroomAtom);

  // Print the honor roll page (from title section onwards, excluding tabs)
  const handlePrintReport = () => {
    try {
      const style = document.createElement("style");
      style.id = "print-style";
      style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }

        #honor-roll-print,
        #honor-roll-print * {
          visibility: visible !important;
        }

        #honor-roll-print {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }

        @page {
          margin: 0.5in;
        }
      }
    `;

      document.head.appendChild(style);

      window.print();

      // Remove style after print
      setTimeout(() => {
        const printStyle = document.getElementById("print-style");
        if (printStyle) {
          document.head.removeChild(printStyle);
        }
      }, 300);
    } catch (error) {
      console.error("Error printing report:", error);
    }
  };

  // Share honor roll via clipboard or social media
  const handleShareSuccess = async () => {
    try {
      const shareText = `🏆 Honor Roll - ${classroom?.name} 🏆\n\n${top5
        .map(
          (student: any, index: number) =>
            `${index + 1}. ${student.fullName} - Score: ${student.score}`,
        )
        .join("\n")}\n\nDate: ${dayjs(exam.examDate).format("DD MMM YYYY")}`;

      // Use Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: `Honor Roll - ${classroom?.name}`,
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert("Honor roll copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing honor roll:", error);
    }
  };

  return (
    <Box id="honor-roll-print" sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Title Section */}
      <Box textAlign="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t("title")} {tc(`months.${dayjs(exam.examDate).format("MMM")}`)}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {t("grade")} {classroom?.name} {t("yearStudy")} {classroom?.year}
        </Typography>
        <Box
          sx={{
            height: 2,
            width: 60,
            background: "linear-gradient(90deg, #1976D2, #FFC107)",
            mx: "auto",
            mt: 2,
            borderRadius: 1,
          }}
        />
      </Box>

      {/* Rank #1 - Featured */}
      {top5.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Paper
            elevation={2}
            sx={{
              width: { xs: "80%", md: "50%" },
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #FFC107",
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      bgcolor: "#FFC107",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid white",
                    }}
                  >
                    1
                  </Box>
                }
                sx={{ "& .MuiBadge-badge": { top: -8, right: -8 } }}
              >
                <Avatar
                  src={String(top5[0]?.avatarUrl || "")}
                  alt={String(top5[0]?.fullName || "")}
                  sx={{ width: 80, height: 80, border: "2px solid #FFC107" }}
                >
                  {String(top5[0]?.fullName || "?")[0]}
                </Avatar>
              </Badge>
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={0.5}>
              {top5[0]?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("1Rank")}
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Rank #2 and #3 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        {top5.length > 1 && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #BDBDBD",
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      bgcolor: "#BDBDBD",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid white",
                    }}
                  >
                    2
                  </Box>
                }
                sx={{ "& .MuiBadge-badge": { top: -8, right: -8 } }}
              >
                <Avatar
                  src={String(top5[1]?.avatarUrl || "")}
                  alt={String(top5[1]?.fullName || "")}
                  sx={{ width: 80, height: 80, border: "2px solid #BDBDBD" }}
                >
                  {String(top5[1]?.fullName || "?")[0]}
                </Avatar>
              </Badge>
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={0.5}>
              {top5[1]?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("2Rank")}
            </Typography>
          </Paper>
        )}
        {top5.length > 2 && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #FF9800",
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      bgcolor: "#FF9800",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid white",
                    }}
                  >
                    3
                  </Box>
                }
                sx={{ "& .MuiBadge-badge": { top: -8, right: -8 } }}
              >
                <Avatar
                  src={String(top5[2]?.avatarUrl || "")}
                  alt={String(top5[2]?.fullName || "")}
                  sx={{ width: 80, height: 80, border: "2px solid #FF9800" }}
                >
                  {String(top5[2]?.fullName || "?")[0]}
                </Avatar>
              </Badge>
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={0.5}>
              {top5[2]?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("3Rank")}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Rank #4 and #5 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        {top5.length > 3 && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #1976D2",
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      bgcolor: "#1976D2",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid white",
                    }}
                  >
                    4
                  </Box>
                }
                sx={{ "& .MuiBadge-badge": { top: -8, right: -8 } }}
              >
                <Avatar
                  src={String(top5[3]?.avatarUrl || "")}
                  alt={String(top5[3]?.fullName || "")}
                  sx={{ width: 80, height: 80, border: "2px solid #1976D2" }}
                >
                  {String(top5[3]?.fullName || "?")[0]}
                </Avatar>
              </Badge>
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={0.5}>
              {top5[3]?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("4Rank")}
            </Typography>
          </Paper>
        )}
        {top5.length > 4 && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: "center",
              borderRadius: 2,
              border: "1px solid #7C4DFF",
            }}
          >
            <Box
              sx={{
                position: "relative",
                mb: 2,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Badge
                badgeContent={
                  <Box
                    sx={{
                      bgcolor: "#7C4DFF",
                      color: "white",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      border: "2px solid white",
                    }}
                  >
                    5
                  </Box>
                }
                sx={{ "& .MuiBadge-badge": { top: -8, right: -8 } }}
              >
                <Avatar
                  src={String(top5[4]?.avatarUrl || "")}
                  alt={String(top5[4]?.fullName || "")}
                  sx={{ width: 80, height: 80, border: "2px solid #7C4DFF" }}
                >
                  {String(top5[4]?.fullName || "?")[0]}
                </Avatar>
              </Badge>
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={0.5}>
              {top5[4]?.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("5Rank")}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Footer Quote/Info */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          textAlign: "center",
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Stack direction="row" justifyContent="center" spacing={1}>
          <IconButton
            aria-label="Print this page"
            size="small"
            onClick={handlePrintReport}
            title="Print this page"
          >
            <PrintIcon />
          </IconButton>
          <IconButton
            aria-label={t("shareSuccess")}
            size="small"
            onClick={handleShareSuccess}
            title={t("shareSuccess")}
          >
            <ShareIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
};
