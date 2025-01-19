// components/TreeView.tsx
'use client';

import React, {useState, useEffect} from 'react';
import Tree from 'react-d3-tree';
import Modal from './Modal';
import AddCategoryModal from './AddCategoryModal';
import Sidebar from './Sidebar';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faInfoCircle, faBars} from '@fortawesome/free-solid-svg-icons';
import {Category} from '@/app/models/Category';
import {Literature} from '@/app/models/Literature';
import {
    deleteDoc,
    doc,
    getDocs,
    collection,
    setDoc,
} from 'firebase/firestore';
import {db} from '../../../firebaseConfig';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {subscribeToCategories, subscribeToLiterature} from "@/utils/firebaseUtils";

interface TreeViewProps {
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    onCategoryClick: (id: string) => void;
}

const TreeView: React.FC<TreeViewProps> = ({
                                               categories,
                                               setCategories,
                                           }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalDescription, setModalDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null
    );
    const [literatureList, setLiteratureList] = useState<Literature[]>([]);
    const [addCategoryModalVisible, setAddCategoryModalVisible] =
        useState(false);
    const [parentCategoryId, setParentCategoryId] = useState<string | null>(
        null
    );
    const [selectedLiteratureForAssignment, setSelectedLiteratureForAssignment] =
        useState<Literature | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    // New state variables for moving nodes
    const [nodeToMove, setNodeToMove] = useState<any>(null);
    const [moveMode, setMoveMode] = useState<boolean>(false);

    useEffect(() => {
        const unsubscribe = subscribeToCategories(setCategories);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToLiterature(setLiteratureList);
        return () => unsubscribe();
    }, []);

    const fetchLiterature = async () => {
        try {
            const literatureCollection = collection(db, 'literature');
            const literatureSnapshot = await getDocs(literatureCollection);
            const literatureData = literatureSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Literature, 'id'>),
            }));
            setLiteratureList(literatureData);
        } catch (error) {
            console.error('Error fetching literature:', error);
        }
    };

    const handleNodeClick = (nodeData: any) => {
        if (selectedLiteratureForAssignment) return;

        if (moveMode && nodeToMove) {
            // Prevent moving a node under itself or its descendants
            if (isDescendant(nodeToMove, nodeData)) {
                alert('Cannot move a node under itself or its descendant.');
                return;
            }
            // Perform the move
            moveNodeToNewParent(nodeToMove, nodeData);
            setNodeToMove(null);
            setMoveMode(false);
        } else {
            const nodeId = nodeData.attributes?.id;

            if (nodeId) {
                setParentCategoryId(nodeId);
                setAddCategoryModalVisible(true);
            } else {
                console.warn('Node clicked does not have a valid ID:', nodeData);
            }
        }
    };

    const handleInfoClick = (nodeDatum: any) => {
        if (selectedLiteratureForAssignment) return;

        const nodeId = nodeDatum.attributes.id;

        const category = findCategoryById(categories, nodeId);

        if (category) {
            setSelectedCategory(category);
            setModalDescription(category.description || 'No description');
            setModalVisible(true);
        } else {
            console.warn('Category not found for the selected node.');
        }
    };

    const exportTreeToExcel = () => {
        const literatureIdMap = new Map<string, number>();
        const literatureData = literatureList.map((lit, index) => {
            const intId = index + 1;
            literatureIdMap.set(lit.id, intId);
            return {
                ID: intId,
                Title: lit.title,
                Author: lit.author || '',
                Date: lit.date || '',
                URL: lit.url,
            };
        });

        const flattenedData = flattenTreeData(categories, literatureIdMap);

        const literatureWorksheet = XLSX.utils.json_to_sheet(literatureData);
        const categoriesWorksheet = XLSX.utils.json_to_sheet(flattenedData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, literatureWorksheet, 'Literature');
        XLSX.utils.book_append_sheet(workbook, categoriesWorksheet, 'Categories');

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
        });

        const data = new Blob([excelBuffer], {type: 'application/octet-stream'});
        saveAs(data, 'categories_tree.xlsx');
    };

    const flattenTreeData = (
        categories: Category[],
        literatureIdMap: Map<string, number>,
        level = 0,
        parentPath = ''
    ): any[] => {
        let result: any[] = [];
        categories.forEach((category) => {
            const currentPath = parentPath
                ? `${parentPath} > ${category.name}`
                : category.name;

            const literatureIds = (category.literatureIds || [])
                .map((id) => literatureIdMap.get(id) || 'Unknown')
                .join(', ');

            result.push({
                Level: level,
                Name: category.name,
                Description: category.description || '',
                LiteratureIDs: literatureIds,
                Path: currentPath,
            });

            if (category.children && category.children.length > 0) {
                result = result.concat(
                    flattenTreeData(
                        category.children,
                        literatureIdMap,
                        level + 1,
                        currentPath
                    )
                );
            }
        });
        return result;
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const updateCategoryInTree = (
        categories: Category[],
        updatedCategory: Category
    ): Category[] => {
        return categories.map((category) => {
            if (category.id === updatedCategory.id) {
                return updatedCategory;
            } else if (category.children && category.children.length > 0) {
                return {
                    ...category,
                    children: updateCategoryInTree(category.children, updatedCategory),
                };
            }
            return category;
        });
    };

    const treeData = convertToTreeData(categories);

    const handleAddCategory = async (newCategory: Category) => {
        if (parentCategoryId) {
            const updatedCategories = addSubcategory(
                categories,
                parentCategoryId,
                newCategory
            );
            setCategories(updatedCategories);
        } else {
            setCategories([...categories, newCategory]);
        }

        try {
            const docRef = doc(db, 'categories', newCategory.id);
            await setDoc(docRef, newCategory);
        } catch (error) {
            console.error('Error adding category to Firebase:', error);
        }

        setParentCategoryId(null);
    };

    const addSubcategory = (
        categories: Category[],
        parentId: string,
        newSubcategory: Category
    ): Category[] => {
        return categories.map((category) => {
            if (category.id === parentId) {
                return {
                    ...category,
                    children: [...(category.children || []), newSubcategory],
                };
            } else if (category.children && category.children.length > 0) {
                return {
                    ...category,
                    children: addSubcategory(
                        category.children,
                        parentId,
                        newSubcategory
                    ),
                };
            }
            return category;
        });
    };

    const findCategoryById = (
        categories: Category[],
        id: string
    ): Category | undefined => {
        for (const category of categories) {
            if (category.id === id) {
                return category;
            }
            if (category.children) {
                const foundChild = findCategoryById(category.children, id);
                if (foundChild) return foundChild;
            }
        }
        return undefined;
    };

    const deleteCategory = () => {
        if (selectedCategory) {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete "${selectedCategory.name}"?`
            );

            if (confirmDelete) {
                const updatedCategories = removeCategoryFromTree(
                    categories,
                    selectedCategory.id
                );

                setCategories(updatedCategories);
                setModalVisible(false);

                try {
                    const docRef = doc(db, 'categories', selectedCategory.id);
                    deleteDoc(docRef);
                } catch (error) {
                    console.error('Error deleting category from Firebase:', error);
                }
            }
        }
    };

    const removeCategoryFromTree = (
        categories: Category[],
        categoryIdToRemove: string
    ): Category[] => {
        return categories
            .filter((category) => category.id !== categoryIdToRemove)
            .map((category) => ({
                ...category,
                children: category.children
                    ? removeCategoryFromTree(category.children, categoryIdToRemove)
                    : [],
            }));
    };

    const attachLiteratureToCategory = async (literatureId: string) => {
        if (!selectedCategory) return;

        const updatedLiteratureIds = [
            ...(selectedCategory.literatureIds || []),
            literatureId,
        ];

        const updatedCategory: Category = {
            ...selectedCategory,
            literatureIds: updatedLiteratureIds,
        };

        const updatedCategories = updateCategoryInTree(categories, updatedCategory);
        setCategories(updatedCategories);
        setSelectedCategory(updatedCategory);

        try {
            const docRef = doc(db, 'categories', updatedCategory.id);
            await setDoc(docRef, updatedCategory);
        } catch (error) {
            console.error('Error updating category in Firebase:', error);
        }
    };

    const detachLiteratureFromCategory = async (literatureId: string) => {
        if (!selectedCategory) return;

        const updatedLiteratureIds = (
            selectedCategory.literatureIds || []
        ).filter((id) => id !== literatureId);

        const updatedCategory: Category = {
            ...selectedCategory,
            literatureIds: updatedLiteratureIds,
        };

        const updatedCategories = updateCategoryInTree(categories, updatedCategory);
        setCategories(updatedCategories);
        setSelectedCategory(updatedCategory);

        try {
            const docRef = doc(db, 'categories', updatedCategory.id);
            await setDoc(docRef, updatedCategory);
        } catch (error) {
            console.error('Error updating category in Firebase:', error);
        }
    };

    const propagateColorToChildren = (
        categories: Category[],
        nodeId: string,
        newColor: string
    ): Category[] => {
        return categories.map((category) => {
            if (category.id === nodeId) {
                return propagateColorToDescendants(category, newColor);
            }

            if (category.children && category.children.length > 0) {
                return {
                    ...category,
                    children: propagateColorToChildren(
                        category.children,
                        nodeId,
                        newColor
                    ),
                };
            }

            return category;
        });
    };

    const propagateColorToDescendants = (
        category: Category,
        newColor: string
    ): Category => {
        return {
            ...category,
            color: newColor,
            children: category.children
                ? category.children.map((child) =>
                    propagateColorToDescendants(child, newColor)
                )
                : [],
        };
    };

    const handleUpdateCategoryColor = async (color: string) => {
        if (selectedCategory) {
            const updatedCategories = propagateColorToChildren(
                categories,
                selectedCategory.id,
                color
            );
            setCategories(updatedCategories);

            try {
                const updatedCategory = findCategoryById(
                    updatedCategories,
                    selectedCategory.id
                );
                if (updatedCategory) {
                    const docRef = doc(db, 'categories', updatedCategory.id);
                    await setDoc(docRef, updatedCategory);
                }
            } catch (error) {
                console.error('Error updating category color:', error);
            }
        }
    };

    const handleSelectLiterature = (literature: Literature | null) => {
        setSelectedLiteratureForAssignment(literature);
    };

    const handleCheckboxChange = async (nodeDatum: any, checked: boolean) => {
        const categoryId = nodeDatum.attributes.id;
        const category = findCategoryById(categories, categoryId);

        if (!category || !selectedLiteratureForAssignment) return;

        let updatedLiteratureIds = category.literatureIds || [];

        if (checked) {
            if (!updatedLiteratureIds.includes(selectedLiteratureForAssignment.id)) {
                updatedLiteratureIds = [
                    ...updatedLiteratureIds,
                    selectedLiteratureForAssignment.id,
                ];
            }
        } else {
            updatedLiteratureIds = updatedLiteratureIds.filter(
                (id) => id !== selectedLiteratureForAssignment.id
            );
        }

        const updatedCategory: Category = {
            ...category,
            literatureIds: updatedLiteratureIds,
        };

        const updatedCategories = updateCategoryInTree(categories, updatedCategory);
        setCategories(updatedCategories);

        try {
            const docRef = doc(db, 'categories', updatedCategory.id);
            await setDoc(docRef, updatedCategory);
        } catch (error) {
            console.error('Error updating category in Firebase:', error);
        }
    };

    const updateCategoryDescription = async (id: string, description: string) => {
        const category = findCategoryById(categories, id);
        if (!category) {
            console.warn(`Category not found: ${id}`);
            return;
        }

        const updatedCategory: Category = {...category, description};

        const updatedCategories = updateCategoryInTree(categories, updatedCategory);
        setCategories(updatedCategories);

        try {
            const docRef = doc(db, 'categories', id);
            await setDoc(docRef, updatedCategory);
        } catch (error) {
            console.error(
                'Error updating Firestore:',
                error instanceof Error ? error.message : error
            );
        }
    };

    const calculateCircleRadius = (text: string): number => {
        const baseRadius = 15;
        const padding = 5;
        return baseRadius + Math.min(text.length, 20) * 2 + padding;
    };

    const isDescendant = (parentNode: any, childNode: any): boolean => {
        if (parentNode.attributes.id === childNode.attributes.id) {
            return true;
        }
        if (!parentNode.children) {
            return false;
        }
        return parentNode.children.some((child: any) =>
            isDescendant(child, childNode)
        );
    };

    const moveNodeToNewParent = async (nodeToMoveData: any, newParentData: any) => {
        const nodeId = nodeToMoveData.attributes.id;
        const newParentId = newParentData.attributes.id;

        // Remove node from its current location
        let updatedCategories = removeCategoryFromTree(categories, nodeId);

        // Find the node to move
        const nodeToMoveCategory = findCategoryById(
            [convertNodeDatumToCategory(nodeToMoveData)],
            nodeId
        );
        if (!nodeToMoveCategory) {
            console.error('Node to move not found.');
            return;
        }

        // Add node under the new parent
        updatedCategories = addSubcategory(
            updatedCategories,
            newParentId,
            nodeToMoveCategory
        );

        setCategories(updatedCategories);

        // Update in Firebase
        try {
            // Update the entire categories collection in Firebase
            for (const category of updatedCategories) {
                await updateCategoryInFirebase(category);
            }
        } catch (error) {
            console.error('Error updating categories in Firebase:', error);
        }
    };

    const updateCategoryInFirebase = async (category: Category) => {
        const docRef = doc(db, 'categories', category.id);
        await setDoc(docRef, category);

        if (category.children && category.children.length > 0) {
            for (const child of category.children) {
                await updateCategoryInFirebase(child);
            }
        }
    };

    const convertNodeDatumToCategory = (nodeDatum: any): Category => {
        return {
            id: nodeDatum.attributes.id,
            name: nodeDatum.name,
            description: nodeDatum.attributes.description,
            color: nodeDatum.color,
            literatureIds: [], // Add any other properties as needed
            children: nodeDatum.children
                ? nodeDatum.children.map((child: any) =>
                    convertNodeDatumToCategory(child)
                )
                : [],
        };
    };

    const renderCustomNodeElement = ({
                                         nodeDatum,
                                         toggleNode,
                                     }: {
        nodeDatum: any;
        toggleNode: () => void;
    }) => {
        const radius = calculateCircleRadius(nodeDatum.name);
        const isParent = nodeDatum.children && nodeDatum.children.length > 0;

        let isChecked = false;
        const showCheckbox = selectedLiteratureForAssignment !== null;

        if (
            showCheckbox &&
            selectedLiteratureForAssignment &&
            nodeDatum &&
            nodeDatum.attributes &&
            nodeDatum.attributes.id
        ) {
            const category = findCategoryById(categories, nodeDatum.attributes.id);
            if (category && category.literatureIds) {
                isChecked = category.literatureIds.includes(
                    selectedLiteratureForAssignment.id
                );
            }
        }

        const isNodeToMove =
            nodeToMove && nodeToMove.attributes.id === nodeDatum.attributes.id;

        const handleClick = () => {
            if (!showCheckbox) handleNodeClick(nodeDatum);
        };

        const handleInfoClickWrapper = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!showCheckbox) handleInfoClick(nodeDatum);
        };

        const handleAddSubcategoryClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!showCheckbox) {
                if (nodeDatum && nodeDatum.attributes && nodeDatum.attributes.id) {
                    setParentCategoryId(nodeDatum.attributes.id);
                    setAddCategoryModalVisible(true);
                }
            }
        };

        const handleMoveClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!showCheckbox) {
                setNodeToMove(nodeDatum);
                setMoveMode(true);
            }
        };

        const handleCheckboxChangeWrapper = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            e.stopPropagation();
            handleCheckboxChange(nodeDatum, e.target.checked);
        };

        return (
            <g>
                <circle
                    r={radius}
                    fill={isNodeToMove ? 'yellow' : nodeDatum.color}
                    stroke="black"
                    strokeWidth="1"
                    onClick={handleClick}
                />
                <text
                    fill="white"
                    strokeWidth="1"
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontSize="12"
                    onClick={handleClick}
                >
                    {nodeDatum.name}
                </text>
                {showCheckbox && (
                    <foreignObject
                        x={-15}
                        y={radius + 10}
                        width="30"
                        height="30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheckboxChangeWrapper}
                            />
                        </div>
                    </foreignObject>
                )}
                {!showCheckbox && (
                    <>
                        <foreignObject
                            x={radius + 10}
                            y="-10"
                            width="30"
                            height="30"
                            className="cursor-pointer"
                            onClick={handleInfoClickWrapper}
                        >
                            <div>
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    className="text-blue-500 w-4 h-4"
                                    title={nodeDatum.attributes.description || 'No description'}
                                />
                            </div>
                        </foreignObject>
                        <foreignObject
                            x={radius + 10}
                            y="10"
                            width="30"
                            height="30"
                            className="cursor-pointer"
                            onClick={handleAddSubcategoryClick}
                        >
                            <div>
                                <button
                                    className="bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                    +
                                </button>
                            </div>
                        </foreignObject>
                        {!moveMode && (
                            <foreignObject
                                x={radius + 10}
                                y="30"
                                width="30"
                                height="30"
                                className="cursor-pointer"
                                onClick={handleMoveClick}
                            >
                                <div>
                                    <button
                                        className="bg-yellow-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                        M
                                    </button>
                                </div>
                            </foreignObject>
                        )}
                    </>
                )}
                {moveMode && !isNodeToMove && (
                    <text
                        fill="red"
                        x="0"
                        y={radius + 20}
                        textAnchor="middle"
                        fontSize="10"
                    >
                        Click to move here
                    </text>
                )}
                {isParent && (
                    <text
                        fill="black"
                        x={-(radius + 10)}
                        y="5"
                        fontSize="16"
                        className="cursor-pointer"
                        textAnchor="middle"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleNode();
                        }}
                    >
                        {nodeDatum.__rd3t.collapsed ? '+' : '-'}
                    </text>
                )}
            </g>
        );
    };

    if (!treeData || treeData.length === 0) {
        return (
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create a New Category</h3>
                <button
                    onClick={() => {
                        setParentCategoryId(null);
                        setAddCategoryModalVisible(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Add Category
                </button>
                <AddCategoryModal
                    isVisible={addCategoryModalVisible}
                    onClose={() => setAddCategoryModalVisible(false)}
                    onAddCategory={handleAddCategory}
                    parentCategory={null}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-screen relative">
            <div className="bg-white w-fit">
                <Sidebar
                    onSelectLiterature={handleSelectLiterature}
                    literatureList={literatureList}
                    sidebarOpen={sidebarOpen}
                />
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="fixed top-4 z-50 bg-blue-500 text-white p-2 rounded-full focus:outline-none transition-transform duration-300 ease-in-out"
                    style={{
                        left: sidebarOpen ? '16rem' : '1rem',
                        transition: 'left 0.3s ease-in-out',
                    }}
                    aria-label="Toggle Sidebar"
                >
                    <FontAwesomeIcon icon={faBars} size="lg"/>
                </button>
            </div>
            <div
                id="treeWrapper"
                className="relative h-full"
                style={{
                    marginLeft: sidebarOpen ? '16rem' : '0',
                    transition: 'margin-left 0.3s ease-in-out',
                }}
            >
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={exportTreeToExcel}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Export to Excel
                    </button>
                </div>
                <Tree
                    data={treeData}
                    orientation="vertical"
                    translate={{x: 500, y: 50}}
                    renderCustomNodeElement={renderCustomNodeElement}
                    collapsible={true}
                />

                {selectedLiteratureForAssignment && (
                    <div className="absolute top-0 right-0 m-4">
                        <button
                            onClick={() => setSelectedLiteratureForAssignment(null)}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Done
                        </button>
                    </div>
                )}

                {moveMode && (
                    <div className="absolute top-0 left-0 m-4">
                        <button
                            onClick={() => {
                                setMoveMode(false);
                                setNodeToMove(null);
                            }}
                            className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Cancel Move
                        </button>
                    </div>
                )}

                <Modal
                    isVisible={modalVisible}
                    onClose={closeModal}
                    category={selectedCategory}
                    attachLiteratureToCategory={attachLiteratureToCategory}
                    deleteCategory={deleteCategory}
                    detachLiteratureFromCategory={detachLiteratureFromCategory}
                    updateCategoryColor={handleUpdateCategoryColor}
                    literatureList={literatureList}
                    updateCategoryDescription={updateCategoryDescription}
                />
                <AddCategoryModal
                    isVisible={addCategoryModalVisible}
                    onClose={() => setAddCategoryModalVisible(false)}
                    onAddCategory={handleAddCategory}
                    parentCategory={
                        parentCategoryId
                            ? findCategoryById(categories, parentCategoryId)
                            : null
                    }
                />
            </div>
        </div>
    );
};

// Helper Functions
const convertToTreeData = (categories: Category[]): any[] => {
    return categories.map((category) => ({
        name: category.name || 'Unnamed Category',
        attributes: {
            id: category.id || 'Unknown ID',
            description: category.description || 'No description',
        },
        color: category.color || '#ff6347',
        children:
            category.children && category.children.length > 0
                ? convertToTreeData(category.children)
                : [],
    }));
};

export default TreeView;
