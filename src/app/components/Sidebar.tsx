// components/Sidebar.tsx
'use client';

import React, {useState} from 'react';
import {Literature} from '@/app/models/Literature';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
} from 'firebase/firestore';
import {db} from '../../../firebaseConfig';
import {addNewLiterature} from "@/utils/firebaseUtils";

interface SidebarProps {
    onSelectLiterature: (literature: Literature | null) => void;
    literatureList: Literature[];
    sidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             onSelectLiterature,
                                             literatureList,
                                             sidebarOpen,
                                         }) => {
    const [newLiterature, setNewLiterature] = useState<Omit<Literature, 'id'>>({
        title: '',
        author: '',
        date: '',
        url: '',
        note: '',
        sortOrder: undefined
    });

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState<string>('');

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const {name, value} = e.target;
        setNewLiterature((prev) => ({...prev, [name]: value}));
    };

    const addLiterature = async () => {
        try {
            addNewLiterature(newLiterature);
            setNewLiterature({title: '', author: '', date: '', url: '', note: '', sortOrder: undefined});
        } catch (error) {
            console.error('Error adding literature:', error);
        }
    };

    const deleteLiteratureItem = async (literatureId: string) => {
        try {
            await deleteDoc(doc(db, 'literature', literatureId));
        } catch (error) {
            console.error('Error deleting literature:', error);
        }
    };

    const handleEditNote = (literature: Literature) => {
        setEditingNoteId(literature.id);
        setNoteInput(literature.note || '');
    };

    const handleSaveNote = async (literatureId: string) => {
        try {
            const literatureRef = doc(db, 'literature', literatureId);
            //@ts-ignore
            await updateDoc(literatureRef, {note: noteInput});
            setEditingNoteId(null);
            setNoteInput('');
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setNoteInput('');
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out overflow-y-auto z-40`}
            >
                <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Literature</h3>
                    {/* Deselect Literature */}
                    <button
                        onClick={() => onSelectLiterature(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded mt-4 w-full"
                    >
                        Deselect Literature
                    </button>

                    {/* Add New Literature */}
                    <div className="mt-6">
                        <h4 className="text-md font-semibold mb-2">Add New Literature</h4>
                        <input
                            type="text"
                            name="title"
                            value={newLiterature.title}
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full mb-2"
                            placeholder="Title"
                            required
                        />
                        <input
                            type="text"
                            name="author"
                            value={newLiterature.author}
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full mb-2"
                            placeholder="Author"
                        />
                        <input
                            type="date"
                            name="date"
                            value={newLiterature.date}
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full mb-2"
                        />
                        <input
                            type="url"
                            name="url"
                            value={newLiterature.url}
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full mb-2"
                            placeholder="URL"
                            required
                        />
                        <textarea
                            name="note"
                            value={newLiterature.note}
                            onChange={handleInputChange}
                            className="border p-2 rounded w-full mb-2"
                            placeholder="Note"
                            rows={3}
                        />
                        <button
                            onClick={addLiterature}
                            className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                            disabled={!newLiterature.title || !newLiterature.url}
                        >
                            Add Literature
                        </button>
                    </div>
                    {/* Literature List */}
                    {literatureList.length > 0 ? (
                        <ul>
                            {literatureList.map((lit) => (
                                <li key={lit.id} className="mb-2">
                                    <div
                                        className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                                        onClick={() => onSelectLiterature(lit)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{lit.title}</span>
                                            <div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditNote(lit);
                                                    }}
                                                    className="text-green-500 hover:text-green-700 mr-2"
                                                >
                                                    Edit Note
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteLiteratureItem(lit.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {editingNoteId === lit.id ? (
                                            <div className="mt-2">
                        <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            className="border p-2 rounded w-full"
                            rows={3}
                        />
                                                <div className="flex justify-end mt-1">
                                                    <button
                                                        onClick={() => handleSaveNote(lit.id)}
                                                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="bg-gray-500 text-white px-2 py-1 rounded"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-1">
                                                <p className="text-sm">{lit.note || 'No note'}</p>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No literature available.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
