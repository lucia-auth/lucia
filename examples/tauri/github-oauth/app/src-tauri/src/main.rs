// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::api::shell;
use tauri::{AppHandle, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::net::TcpListener;

#[tauri::command]
async fn authenticate(app_handle: AppHandle) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    shell::open(
        &app_handle.shell_scope(),
        format!("http://localhost:3000/login/github?port={}", port),
        None,
    )
    .unwrap();
    let (mut stream, _) = listener.accept().await.unwrap();
    let (reader, writer) = stream.split();
    let mut buf_reader = BufReader::new(reader);
    let mut buf = String::new();
    // the pathname is the 2nd item in the first line
    buf_reader.read_line(&mut buf).await.unwrap();
    let url = buf.split_ascii_whitespace().nth(1).unwrap();
    let (_, query) = url.split_once('?').unwrap_or_default();
    for query_pair in query.split('&') {
        if let Some(("session_token", value)) = query_pair.split_once('=') {
            writer
                .try_write(
                    b"HTTP/1.1 200 OK\r\n\r\nSuccessfully logged in. You can now close this tab.",
                )
                .unwrap();
            return Ok(value.to_string());
        }
    }
    Err("Missing session".to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![authenticate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
