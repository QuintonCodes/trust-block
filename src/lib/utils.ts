import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Web3Error = {
  shortMessage?: string;
  message?: string;
}

export function getCleanErrorMessage(error: Web3Error | null | undefined): string {
  if (!error) return "";

  const msgText = (error.shortMessage || error.message || "").toLowerCase();

  if (msgText.includes("user rejected") || msgText.includes("user denied")) {
    return "Transaction was cancelled.";
  }
  if (msgText.includes("insufficient funds")) {
    return "You do not have enough funds to cover this transaction and gas fees.";
  }
  if (msgText.includes("unrecognized-selector")) {
    return "Contract error: Function not found. Check if the correct contract is deployed.";
  }

  return error.shortMessage || "Transaction failed. Please try again.";
}