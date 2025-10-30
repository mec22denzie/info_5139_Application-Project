/* nav link function logic*/

$("nav").on("click", e => {
	if (e.target.dataset.section) {
		const dataset = e.target.dataset.section;
		$("nav li").removeClass("navSelected");

		$(`#nav-${dataset}`).addClass("navSelected");
		/* hidden all the content */

		$("main > section").addClass("hidden");
		$("main > section").removeClass("show");
		/* show the selected content */

		$(`#${dataset}`).removeClass("hidden");
		$(`#${dataset}`).addClass("show");
	}
});
