"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import ClassroomService from "@/app/service/ClassroomService";
import EmptyStateCard from "@/app/dashboard/components/Common/EmptyStateCard";
import useClassroomData from "@/app/libs/hooks/useClassroomData";
import { BookRecordResponse } from "@/app/constants/type/Record";
import { StudentsInfo } from "@/app/constants/type";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SearchIcon from "@mui/icons-material/Search";
import ManIcon from "@mui/icons-material/Man";
import WomanIcon from "@mui/icons-material/Woman";
import PersonIcon from "@mui/icons-material/Person";

type Tone = "primary" | "info" | "secondary" | "success" | "warning" | "error";

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function gradeTone(grade?: string): Tone {
  if (!grade) return "primary";
  const g = grade.trim().toUpperCase();
  if (g.startsWith("A")) return "success";
  if (g.startsWith("B")) return "info";
  if (g.startsWith("C") || g.startsWith("D")) return "warning";
  return "error";
}

function formatNum(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return Number(n).toFixed(2);
}

function formatInt(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "";
  return String(n);
}

export default function Page() {
  const t = useTranslations();
  const theme = useTheme();

  const classroom = useAtomValue(classroomAtom);
  const { students } = useClassroomData(classroom);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [data, setData] = useState<BookRecordResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBookRecord = useCallback(
    async (stuId: string) => {
      try {
        if (!classroom?.id) return;
        setIsLoading(true);
        const result = await ClassroomService.getBookRocord({
          classId: classroom.id,
          stuId,
        });
        setData(result || null);
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [classroom?.id]
  );

  useEffect(() => {
    if (
      !selectedStudentId &&
      students?.student &&
      students.student.length > 0
    ) {
      setSelectedStudentId(students.student[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchBookRecord(selectedStudentId);
    } else {
      setData(null);
    }
  }, [selectedStudentId, fetchBookRecord]);

  const filteredStudents = useMemo(() => {
    const list = students?.student ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.idCard?.toLowerCase().includes(q)
    );
  }, [students, search]);

  // Full bio of the selected student (BookRecordResponse only has limited info)
  const fullStudent: StudentsInfo | undefined = useMemo(
    () => students?.student?.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  if (!classroom?.id) {
    return (
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Card variant="outlined" sx={{ p: 4 }}>
          <EmptyStateCard
            title={t("Common.classroom")}
            description={t("Common.createClassroom")}
            buttonLabel={t("Common.createClassroom")}
            onButtonClick={() => {}}
            minHeight={320}
          />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      {/* Page header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
              width: 44,
              height: 44,
            }}
          >
            <MenuBookIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {t("BookRecord.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[classroom?.name, classroom?.grade, classroom?.year]
                .filter(Boolean)
                .join(" • ")}
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<PrintRoundedIcon />}
          onClick={() => window.print()}
          disabled={!selectedStudentId || !data}
        >
          {t("Common.print")}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {/* Left: Student list */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
          <Card variant="outlined" sx={{ position: { md: "sticky" }, top: 16 }}>
            <Box sx={{ p: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t("Common.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Divider />
            <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t("Common.student")}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                variant="outlined"
                label={filteredStudents.length}
              />
            </Stack>
            <Divider />
            <Box
              sx={{
                maxHeight: { xs: 360, md: 600 },
                overflowY: "auto",
              }}
            >
              {filteredStudents.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    0 / {students?.student?.length ?? 0}
                  </Typography>
                </Box>
              ) : (
                filteredStudents.map((stu) => {
                  const isSelected = selectedStudentId === stu.id;
                  const isFemale = stu.gender === "F";
                  const tone = isFemale
                    ? theme.palette.secondary.main
                    : theme.palette.info.main;
                  return (
                    <Box
                      key={stu.id}
                      onClick={() => setSelectedStudentId(stu.id)}
                      sx={{
                        cursor: "pointer",
                        p: 1.25,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        borderLeft: "3px solid",
                        borderColor: isSelected
                          ? "primary.main"
                          : "transparent",
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "transparent",
                        transition: "background-color .15s ease",
                        "&:hover": {
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.12)
                            : alpha(theme.palette.action.hover, 1),
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: alpha(tone, 0.15),
                          color: tone,
                        }}
                      >
                        {getInitials(stu.fullName)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600 }}
                          noWrap
                        >
                          {stu.fullName || "—"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {stu.idCard || "—"}
                        </Typography>
                      </Box>
                      {isFemale ? (
                        <WomanIcon
                          fontSize="small"
                          sx={{ color: theme.palette.secondary.main }}
                        />
                      ) : (
                        <ManIcon
                          fontSize="small"
                          sx={{ color: theme.palette.info.main }}
                        />
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right: Record detail (Cambodian transcript book layout) */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }} className="print-area">
          {!selectedStudentId ? (
            <Card variant="outlined" sx={{ p: 4 }}>
              <EmptyStateCard
                title={t("Common.student")}
                description={t("Common.search")}
                buttonLabel={t("Common.search")}
                buttonIcon={<PersonIcon />}
                onButtonClick={() => {}}
                minHeight={320}
              />
            </Card>
          ) : isLoading ? (
            <Card variant="outlined" sx={{ p: 6 }}>
              <Stack alignItems="center" spacing={2}>
                <CircularProgress />
              </Stack>
            </Card>
          ) : !data ? (
            <Card variant="outlined" sx={{ p: 4 }}>
              <EmptyStateCard
                title={t("BookRecord.title")}
                description={t("Common.errorOccurred")}
                buttonLabel={t("Common.back")}
                onButtonClick={() => setSelectedStudentId(null)}
                minHeight={240}
              />
            </Card>
          ) : (
            <RecordBook
              data={data}
              fullStudent={fullStudent}
              classroom={classroom}
            />
          )}
        </Grid>
      </Grid>

      {/* Print-only styling — hide chrome, lift the book layout to the page */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute !important;
            top: 0; left: 0; right: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-area .MuiCard-root {
            border: none !important;
            box-shadow: none !important;
          }
          .print-area .MuiTableCell-root {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </Box>
  );
}

/* ================================================================
 * The formal Cambodian academic record book layout (right detail).
 * Mirrors the សៀវភៅសិក្ខាគារិក spreadsheet form: Kingdom header on
 * the left, bio fields below, academic transcript table on the right.
 * ================================================================ */
function RecordBook({
  data,
  fullStudent,
  classroom,
}: {
  data: BookRecordResponse;
  fullStudent?: StudentsInfo;
  classroom: { name?: string; grade?: string; year?: string } | null;
}) {
  const t = useTranslations();
  const theme = useTheme();

  const dob =
    fullStudent?.dateOfBirth ?? data.student?.dateOfBirth ?? null;
  const dobFormatted = dob ? dayjs(dob).format("DD-MM-YYYY") : "—";
  const gender = fullStudent?.gender ?? data.student?.gender;
  const idCard = fullStudent?.idCard ?? data.student?.idCard ?? "—";
  const fullName = fullStudent?.fullName ?? data.student?.fullName ?? "—";

  return (
    <Card variant="outlined">
      <Box
        className="font-siemreap"
        sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.paper" }}
      >
        <Grid container spacing={3}>
          {/* ============= LEFT: Bio side ============= */}
          <Grid size={{ xs: 12, md: 5 }}>
            {/* Formal Cambodian header */}
            <Stack alignItems="center" spacing={0.5} sx={{ mb: 2 }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: { xs: 14, md: 16 } }}
              >
                ព្រះរាជាណាចក្រកម្ពុជា
              </Typography>
              <Typography variant="body2">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ☘ ☘ ☘
              </Typography>
            </Stack>

            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              {t("BookRecord.title")}
            </Typography>

            {/* Bio fields */}
            <Stack spacing={1.25}>
              <BioRow
                label={t("CommonField.idCard")}
                value={idCard}
              />
              <BioRow
                label={t("CommonField.fullName")}
                value={fullName}
                extra={
                  gender ? (
                    <Chip
                      size="small"
                      label={
                        gender === "F" ? t("Common.female") : t("Common.male")
                      }
                      sx={{
                        height: 20,
                        fontSize: 11,
                        bgcolor: alpha(
                          gender === "F"
                            ? theme.palette.secondary.main
                            : theme.palette.info.main,
                          0.12
                        ),
                        color:
                          gender === "F"
                            ? theme.palette.secondary.main
                            : theme.palette.info.main,
                        fontWeight: 700,
                      }}
                    />
                  ) : null
                }
              />
              <BioRow
                label={t("CommonField.dateOfBirth")}
                value={dobFormatted}
              />
              <BioRow
                label={t("CommonField.placeOfBirth")}
                value={fullStudent?.placeOfBirth || "—"}
              />
              <BioRow
                label={t("CommonField.fatherName")}
                value={
                  [fullStudent?.fatherName, fullStudent?.fatherOccupation]
                    .filter(Boolean)
                    .join(" • ") || "—"
                }
              />
              <BioRow
                label={t("CommonField.montherName")}
                value={
                  [fullStudent?.montherName, fullStudent?.montherOccupation]
                    .filter(Boolean)
                    .join(" • ") || "—"
                }
              />
              <BioRow
                label={t("CommonField.address")}
                value={fullStudent?.address || "—"}
              />
            </Stack>

            {/* Enrollment table */}
            <TableContainer sx={{ mt: 3 }}>
              <Table
                size="small"
                sx={{
                  "& .MuiTableCell-root": {
                    border: `1px solid ${theme.palette.divider}`,
                    fontSize: 12,
                    px: 1,
                    py: 0.75,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      {t("Classroom.yearOfStudying")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      {t("Classroom.className")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      {t("CommonField.grade")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      {t("CommonField.idCard")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="center">
                      {classroom?.year || "—"}
                    </TableCell>
                    <TableCell align="center">
                      {classroom?.name || "—"}
                    </TableCell>
                    <TableCell align="center">
                      {classroom?.grade || "—"}
                    </TableCell>
                    <TableCell align="center">{idCard}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* ============= RIGHT: Academic side ============= */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                fontWeight: 700,
                mb: 2.5,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              {t("BookRecord.studyAllSubject")}
            </Typography>

            <AcademicTranscriptTable data={data} />
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}

function BioRow({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={1}
      sx={{ minHeight: 24 }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 140, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mr: 1 }}>
        :
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
        {value}
      </Typography>
      {extra}
    </Stack>
  );
}

function AcademicTranscriptTable({ data }: { data: BookRecordResponse }) {
  const t = useTranslations();
  const theme = useTheme();

  const cellSx = {
    border: `1px solid ${theme.palette.divider}`,
    fontSize: 12,
    px: 0.75,
    py: 0.5,
  } as const;

  const headerCellSx = {
    ...cellSx,
    fontWeight: 700,
    bgcolor: alpha(theme.palette.primary.main, 0.06),
    textAlign: "center" as const,
  };

  const totalRowSx = {
    bgcolor: alpha(theme.palette.primary.main, 0.04),
    "& .MuiTableCell-root": { fontWeight: 700 },
  };

  const subjects = data.subjects ?? [];

  return (
    <TableContainer>
      <Table
        size="small"
        sx={{
          tableLayout: "fixed",
          "& .MuiTableCell-root": cellSx,
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell rowSpan={2} sx={headerCellSx} width="6%">
              {t("CommonField.id")}
            </TableCell>
            <TableCell rowSpan={2} sx={headerCellSx}>
              {t("CommonField.subject")}
            </TableCell>
            <TableCell colSpan={2} sx={headerCellSx} width="18%">
              {t("Common.semesterNum", { num: 1 })}
            </TableCell>
            <TableCell colSpan={2} sx={headerCellSx} width="18%">
              {t("Common.semesterNum", { num: 2 })}
            </TableCell>
            <TableCell colSpan={2} sx={headerCellSx} width="18%">
              {t("BookRecord.annualAverage")}
            </TableCell>
            <TableCell rowSpan={2} sx={headerCellSx} width="10%">
              {t("BookRecord.grade")}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={headerCellSx}>{t("BookTracker.score")}</TableCell>
            <TableCell sx={headerCellSx}>{t("BookRecord.ranking")}</TableCell>
            <TableCell sx={headerCellSx}>{t("BookTracker.score")}</TableCell>
            <TableCell sx={headerCellSx}>{t("BookRecord.ranking")}</TableCell>
            <TableCell sx={headerCellSx}>{t("BookTracker.score")}</TableCell>
            <TableCell sx={headerCellSx}>{t("BookRecord.ranking")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  —
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            subjects.map((sub, idx) => {
              const tone = gradeTone(sub.grade);
              const color = theme.palette[tone].main;
              const code = sub.name || sub.nameEn;
              const kh = sub.nameKh;
              return (
                <TableRow key={sub.id || idx}>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      {code ? (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, fontSize: 12 }}
                        >
                          ({code})
                        </Typography>
                      ) : null}
                      {kh ? (
                        <Typography
                          variant="body2"
                          className="font-siemreap"
                          sx={{ fontSize: 12 }}
                          noWrap
                        >
                          {kh}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">{formatNum(sub.scoreS1)}</TableCell>
                  <TableCell align="center">{formatInt(sub.rankS1)}</TableCell>
                  <TableCell align="center">{formatNum(sub.scoreS2)}</TableCell>
                  <TableCell align="center">{formatInt(sub.rankS2)}</TableCell>
                  <TableCell align="center">
                    {formatNum(sub.scoreAnnual)}
                  </TableCell>
                  <TableCell align="center">
                    {formatInt(sub.rankAnnual)}
                  </TableCell>
                  <TableCell align="center">
                    {sub.grade ? (
                      <Chip
                        size="small"
                        label={sub.grade}
                        sx={{
                          height: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: alpha(color, 0.12),
                          color,
                          border: `1px solid ${alpha(color, 0.25)}`,
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}

          {/* Summary footer rows — mirrors Excel totals at bottom of table */}
          {subjects.length > 0 && (
            <>
              <TableRow sx={totalRowSx}>
                <TableCell colSpan={2} align="center">
                  {t("Common.total")}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalScoreS1)}
                </TableCell>
                <TableCell />
                <TableCell align="center">
                  {formatNum(data.totalScoreS2)}
                </TableCell>
                <TableCell />
                <TableCell colSpan={2} />
                <TableCell />
              </TableRow>
              <TableRow sx={totalRowSx}>
                <TableCell colSpan={2} align="center">
                  {t("BookRecord.average")}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageS1)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankS1)}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageS2)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankS2)}
                </TableCell>
                <TableCell colSpan={2} />
                <TableCell />
              </TableRow>
              <TableRow sx={totalRowSx}>
                <TableCell colSpan={2} align="center">
                  {t("BookRecord.semesterAverage", { num: "" })}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageMonthS1)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankMonthS1)}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageMonthS2)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankMonthS2)}
                </TableCell>
                <TableCell colSpan={2} />
                <TableCell />
              </TableRow>
              <TableRow sx={totalRowSx}>
                <TableCell colSpan={2} align="center">
                  {t("BookRecord.annualAverage")}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageFullS1)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankFullS1)}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageFullS2)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankFullS2)}
                </TableCell>
                <TableCell align="center">
                  {formatNum(data.totalAverageAnnual)}
                </TableCell>
                <TableCell align="center">
                  {formatInt(data.totalRankAnnual)}
                </TableCell>
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
