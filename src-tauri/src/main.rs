// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager}; // for emitting events
use tokio::io::{AsyncBufReadExt, BufReader}; // for streaming stdout
use tokio::process::Command; // async subprocess
use std::{process::Stdio, process::Command, env, path::PathBuf};



#[tauri::command]
async fn run_prompt(prompt: String) -> Result<String, String> {
    let base = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let binary = base.join("../llama.cpp/build/bin/llama-cli");
    let model = base.join("../models/llama3-8b.gguf");


    let mut child = Command::new(binary) // this just takes the path as an argument
      .args(["-m", model.to_str().unwrap(), "p", &prompt]) // just passing the model and prompt in as args
      .stdout(Stdio::piped()) // captures the stdout (standard output) of the child process
      .spawn() // spawns the child process
      .map_err(|e| format!("Failed to spawn process: {}", e))?; // If spawn() fails this maps the error into a custom error string.

      let stdout = child.stdout.take().ok_or("failed to capture")?;
      let reader = BufReader::new(stdout);
      let mut lines = reader.lines();

      // Loops only while lines keep coming in without error
      while let Ok(Some(line)) = lines.next_line().await { // asynchronously waits for next line
        app_handle.emit_all("llm_token", line).ok(); // non-blocking fire-and-forget from the .ok()
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_prompt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
