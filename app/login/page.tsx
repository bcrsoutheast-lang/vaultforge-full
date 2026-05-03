
"use client";
import { useState } from "react";

export default function Login(){
  const [email,setEmail]=useState("");

  async function login(){
    await fetch("/api/member/login",{
      method:"POST",
      body:JSON.stringify({email})
