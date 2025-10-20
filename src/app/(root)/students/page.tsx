"use client";

import {
  StudentsInfo,
  StudentsRequestUpsertType,
  StuInfoDetailResponseType,
} from "@/app/constants/type";
import { InsertOneStudentDialog } from "@/app/dashboard/components/Dialog/InsertOneStudentDialog";
import { classroomAtom } from "@/app/libs/jotai/classroomAtom";
import StudentService from "@/app/service/StudentService";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const columns: GridColDef<(typeof rows)[number]>[] = [
    {
      field: "id",
      headerName: "ល​​រ",
      headerClassName: "font-siemreap",
      width: 90,
    },
    {
      field: "fullName",
      headerName: "គោត្តនាម និងនាម",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "gender",
      headerName: "ភេទ",
      headerClassName: "font-siemreap",
      type: "singleSelect",
      width: 100,
      align: "center",
      headerAlign: "center",
      editable: true,
      sortable: false,
      disableColumnMenu: true,
      valueOptions: ["M", "F"],
    },
    {
      field: "dateOfBirth",
      headerName: "ថ្ងៃខែឆ្នាំកំណើត",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "fatherName",
      headerName: "ឈ្មោះឪពុក",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "fatherOccupation",
      headerName: "មុខរបរ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherName",
      headerName: "ឈ្មោះម្ដាយ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "montherOccupation",
      headerName: "មុខរបរ",
      headerClassName: "font-siemreap",
      width: 150,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "placeOfBirth",
      headerName: "ទីកន្លែងកំណើត",
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
    {
      field: "address",
      headerName: "ទីលំនៅបច្ចុប្បន្ន",
      headerClassName: "font-siemreap",
      width: 200,
      editable: true,
      sortable: false,
      disableColumnMenu: true,
    },
  ];

  const [students, setStudents] = useState<StuInfoDetailResponseType>();
  const [rows, setRows] = useState<StudentsInfo[]>([]);
  const classroom = useAtomValue(classroomAtom);

  const getStudentsInfo = async () => {
    if (classroom) {
      const result = await StudentService.getInfoList(classroom?.id);
      if (result) {
        setStudents(result);
        setRows(result?.student);
      }
    }
  };

  useEffect(() => {
    if (classroom) {
      getStudentsInfo();
    }
  }, [classroom]);

  const handleAddRow = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const sendData: StudentsRequestUpsertType = {
      // id: 0,
      classId: 18,
      fullName: "sovita",
      gender: "M",
      dateOfBirth: "2002-10-17",
      fatherName: "oooo",
      fatherOccupation: "farmer",
      montherName: "wwww",
      montherOccupation: "farmer",
      placeOfBirth: "kt, pp",
      address: "kt, pp",
    };

    const result = await StudentService.upsertStudent(sendData);
    if (result?.status == 200) {
      getStudentsInfo();
    }
    // setRows([...rows, requestData]);
  };

  return (
    <>
      <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
        <Box display={"flex"} justifyContent={"space-between"}>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            Overview
          </Typography>
          <div className="flex gap-3">
            <InsertOneStudentDialog handleSubmit={handleAddRow}/>
            <Button onClick={() => {}} variant="contained" size="small">
              បញ្ជូលសិស្សច្រើន
            </Button>
          </div>
        </Box>
        <Box className="font-siemreap" sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Box>
      </Box>
    </>
  );
}
