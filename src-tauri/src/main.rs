// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod utils;

use std::{
    env::{self, VarError},
    fs,
};

use config::config::Config;
use utils::utils::*;

use dotenv::dotenv;
use twitch_irc::{
    login::StaticLoginCredentials, ClientConfig, SecureTCPTransport, TwitchIRCClient,
};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn logged() -> Result<bool, Error> {
    match get_directory() {
        Some(path) => {
            if !path.exists() {
                fs::create_dir(path.clone())?;
            }
            Ok(Config::exists(path))
        }
        None => Err(Error::Other("Unable to get home directory".into())),
    }
}

#[tauri::command]
async fn save_token(auth: String) -> Result<(), Error> {
    get_token_from_twitch(auth).await?;

    Ok(())
}
fn main() {
    dotenv().ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![logged])
        .invoke_handler(tauri::generate_handler![save_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
