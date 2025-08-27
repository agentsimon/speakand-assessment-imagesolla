import tkinter as tk
from tkinter import filedialog, messagebox
import os

# Function to show a message in a pop-up window
def show_message(title, message, is_error=False):
    if is_error:
        messagebox.showerror(title, message)
    else:
        messagebox.showinfo(title, message)

def select_folder_and_list_items():
    """
    Opens a file dialog for the user to select a folder.
    Lists the contents of the selected folder in a listbox.
    """
    # Open a directory chooser dialog
    folder_path = filedialog.askdirectory()

    # If the user cancels the dialog, folder_path will be an empty string
    if not folder_path:
        show_message("Canceled", "No folder was selected.")
        return

    # Clear any previous content from the listbox
    listbox.delete(0, tk.END)

    try:
        # Get a list of all items (files and directories) in the folder
        items = os.listdir(folder_path)
        items.sort() # Sort the items alphabetically
        # Print the list to the console for your use
        print("Here is the Python list of items:", items)

        # Insert a heading into the listbox
        listbox.insert(tk.END, f"Contents of: {folder_path}")
        listbox.insert(tk.END, "----------------------------------")

        # Check if the folder is empty
        if not items:
            listbox.insert(tk.END, "The selected folder is empty.")
        else:
            # Insert each item into the listbox
            for item in items:
                # Add a label to indicate if it's a directory or file
                item_path = os.path.join(folder_path, item)
                if os.path.isdir(item_path):
                    listbox.insert(tk.END, f"[DIR] {item}")
                else:
                    listbox.insert(tk.END, f"[FILE] {item}")

    except Exception as e:
        show_message("Error", f"An error occurred: {e}", is_error=True)
        # Re-insert the original placeholder text
        listbox.insert(tk.END, "Failed to load folder contents.")

# Create the main application window
root = tk.Tk()
root.title("Folder Content Lister")
root.geometry("600x400")
root.resizable(width=False, height=False) # Prevent window resizing for a fixed layout

# Create a frame for better layout management
main_frame = tk.Frame(root, padx=10, pady=10)
main_frame.pack(fill=tk.BOTH, expand=True)

# Create a button to trigger the folder selection
select_button = tk.Button(
    main_frame,
    text="Select a Folder",
    command=select_folder_and_list_items,
    font=("Helvetica", 12, "bold"),
    bg="#4CAF50",
    fg="white",
    activebackground="#45a049",
    relief=tk.RAISED,
    padx=10,
    pady=5
)
select_button.pack(pady=10)

# Create a listbox to display the items with a scrollbar
listbox_frame = tk.Frame(main_frame)
listbox_frame.pack(fill=tk.BOTH, expand=True)

scrollbar = tk.Scrollbar(listbox_frame)
scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

listbox = tk.Listbox(
    listbox_frame,
    width=80,
    height=20,
    yscrollcommand=scrollbar.set,
    bg="#282c34",
    fg="#ffffff",
    selectbackground="#3a3f4a",
    relief=tk.FLAT,
    bd=0,
    font=("Courier", 10)
)
listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
scrollbar.config(command=listbox.yview)

# Add an initial placeholder text to the listbox
listbox.insert(tk.END, "Select a folder to see its contents.")

# Start the Tkinter event loop
root.mainloop()